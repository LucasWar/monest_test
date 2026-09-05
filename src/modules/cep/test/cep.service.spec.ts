import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { CepService } from '../cep.service';
import { ICepProvider } from '../interfaces/Icep.provider';
import {
  AllProvidersUnavailableException,
  CepNotFoundException,
  CepProviderTimeoutException,
  CepProviderUnavailableException,
} from 'src/common/exeptions/exeptions';
import { CEP_PROVIDERS } from '../intergrations/cep-providers.tokens';
import { PROVIDER_ORDER_STRATEGY } from '../strategies/provider-order.tokens';
import { RESOLUTION_STRATEGY } from '../strategies/resolution-strategy.tokens';
import type { IProviderOrderStrategy } from '../strategies/interfaces/provider-order.strategy.interface';
import type { ICepResolutionStrategy } from '../strategies/interfaces/cep-resolution.strategy.interface';

jest.mock('@nestjs/cache-manager', () => ({
  CACHE_MANAGER: Symbol('CACHE_MANAGER'),
}));

describe('CepService', () => {
  let service: CepService;
  let viaCepMock: jest.Mocked<ICepProvider>;
  let brasilApiMock: jest.Mocked<ICepProvider>;
  let cacheMock: { get: jest.Mock; set: jest.Mock };
  let providerOrderStrategyMock: jest.Mocked<IProviderOrderStrategy>;
  let resolutionStrategyMock: jest.Mocked<ICepResolutionStrategy>;

  beforeEach(async () => {
    viaCepMock = { name: 'viacep', fetch: jest.fn() };
    brasilApiMock = { name: 'brasilapi', fetch: jest.fn() };
    providerOrderStrategyMock = {
      getOrder: jest.fn().mockReturnValue([viaCepMock, brasilApiMock]),
    };
    resolutionStrategyMock = {
      resolve: jest.fn((cep, provider) => provider.fetch(cep)),
    };
    cacheMock = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        CepService,
        { provide: CEP_PROVIDERS, useValue: [viaCepMock, brasilApiMock] },
        { provide: RESOLUTION_STRATEGY, useValue: resolutionStrategyMock },
        {
          provide: PROVIDER_ORDER_STRATEGY,
          useValue: providerOrderStrategyMock,
        },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get(CepService);
  });

  it('faz fallback quando o primeiro provider falha', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepProviderUnavailableException('ECONNREFUSED'),
    );
    brasilApiMock.fetch.mockResolvedValue({
      cep: '01310000',
      logradouro: 'Av. Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const result = await service.findByCep('01310000');

    expect(result.cidade).toBe('São Paulo');
    expect(brasilApiMock.fetch).toHaveBeenCalled();
  });

  it('tenta o próximo provider mesmo se um disser CEP não encontrado', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepNotFoundException('62940000', 'viacep'),
    );
    brasilApiMock.fetch.mockResolvedValue({
      cep: '62940000',
      logradouro: '',
      bairro: '',
      cidade: 'Morada Nova',
      uf: 'CE',
    });

    const result = await service.findByCep('62940000');
    expect(result.cidade).toBe('Morada Nova');
    expect(brasilApiMock.fetch).toHaveBeenCalled();
  });

  it('retorna 404 só quando TODOS os providers dizem não encontrado', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepNotFoundException('00000000', 'viacep'),
    );
    brasilApiMock.fetch.mockRejectedValue(
      new CepNotFoundException('00000000', 'brasilApi'),
    );

    await expect(service.findByCep('00000000')).rejects.toThrow(
      CepNotFoundException,
    );
  });

  it('retorna indisponibilidade quando há mistura de não encontrado e falha', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepNotFoundException('00000000', 'viacep'),
    );
    brasilApiMock.fetch.mockRejectedValue(
      new CepProviderUnavailableException('ECONNREFUSED'),
    );

    await expect(service.findByCep('00000000')).rejects.toThrow(
      AllProvidersUnavailableException,
    );
  });

  it('simula timeout de um provider', async () => {
    resolutionStrategyMock.resolve
      .mockRejectedValueOnce(new Error('timeout'))
      .mockImplementationOnce((cep, provider) => provider.fetch(cep));
    brasilApiMock.fetch.mockResolvedValue({
      cep: '01310000',
      logradouro: 'Av. Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const result = await service.findByCep('01310000');
    expect(result).toBeDefined();
  });

  it('lança AllProvidersUnavailableException quando os dois falham', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepProviderUnavailableException('timeout'),
    );
    brasilApiMock.fetch.mockRejectedValue(
      new CepProviderTimeoutException(3000),
    );

    await expect(service.findByCep('01310000')).rejects.toThrow(
      AllProvidersUnavailableException,
    );
  });
});
