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

describe('CepService', () => {
  let service: CepService;
  let viaCepMock: jest.Mocked<ICepProvider>;
  let brasilApiMock: jest.Mocked<ICepProvider>;

  beforeEach(async () => {
    viaCepMock = { name: 'viacep', fetch: jest.fn() };
    brasilApiMock = { name: 'brasilapi', fetch: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CepService,
        { provide: CEP_PROVIDERS, useValue: [viaCepMock, brasilApiMock] },
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

  it('propaga erro imediatamente se CEP não existe (não tenta o próximo)', async () => {
    viaCepMock.fetch.mockRejectedValue(
      new CepNotFoundException('00000000', 'viacep'),
    );

    await expect(service.findByCep('00000000')).rejects.toThrow(
      CepNotFoundException,
    );
    expect(brasilApiMock.fetch).not.toHaveBeenCalled();
  });

  it('simula timeout de um provider', async () => {
    viaCepMock.fetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10_000)), // nunca resolve a tempo
    );
    brasilApiMock.fetch.mockResolvedValue({
      cep: '01310000',
      logradouro: 'Av. Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });

    const result = await service.findByCep('01310000');
    expect(result).toBeDefined(); // veio do brasilapi, viacep estourou timeout
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
