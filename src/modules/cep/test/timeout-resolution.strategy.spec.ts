import { TimeoutResolutionStrategy } from '../strategies/timeout-resolution.strategy';
import type { ICepProvider } from '../interfaces/Icep.provider';
import {
  CepProviderTimeoutException,
  CepProviderUnavailableException,
} from 'src/common/exeptions/exeptions';

describe('TimeoutResolutionStrategy', () => {
  it('retorna o resultado do provider', async () => {
    const strategy = new TimeoutResolutionStrategy();
    const result = {
      cep: '01310000',
      logradouro: 'Av. Paulista',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    };
    const provider: jest.Mocked<ICepProvider> = {
      name: 'viacep',
      fetch: jest.fn().mockResolvedValue(result),
    };

    await expect(strategy.resolve('01310000', provider)).resolves.toEqual(
      result,
    );
  });

  it('transforma uma resposta pendente em timeout', async () => {
    const strategy = new TimeoutResolutionStrategy();
    const provider: jest.Mocked<ICepProvider> = {
      name: 'viacep',
      fetch: jest.fn().mockImplementation(() => new Promise(() => {})),
    };

    await expect(strategy.resolve('01310000', provider)).rejects.toBeInstanceOf(
      CepProviderTimeoutException,
    );
  });

  it('propaga o erro original do provider', async () => {
    const strategy = new TimeoutResolutionStrategy();
    const error = new CepProviderUnavailableException('ECONNREFUSED');
    const provider: jest.Mocked<ICepProvider> = {
      name: 'viacep',
      fetch: jest.fn().mockRejectedValue(error),
    };

    await expect(strategy.resolve('01310000', provider)).rejects.toBe(error);
  });
});
