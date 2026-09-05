import { RoundRobinProviderOrderStrategy } from '../strategies/round-robin-provider-order.strategy';
import type { ICepProvider } from '../interfaces/Icep.provider';

describe('RoundRobinProviderOrderStrategy', () => {
  it('alterna o provider inicial a cada chamada', () => {
    const strategy = new RoundRobinProviderOrderStrategy();
    const providers = [
      { name: 'viacep', fetch: jest.fn() },
      { name: 'brasilapi', fetch: jest.fn() },
    ] as jest.Mocked<ICepProvider>[];

    expect(strategy.getOrder(providers).map(({ name }) => name)).toEqual([
      'viacep',
      'brasilapi',
    ]);
    expect(strategy.getOrder(providers).map(({ name }) => name)).toEqual([
      'brasilapi',
      'viacep',
    ]);
  });
});
