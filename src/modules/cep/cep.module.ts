import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CepService } from './cep.service';
import { CepController } from './cep.controller';
import { HttpClientService } from 'src/common/http/http-client.service';
import { BrasilApiProvider } from './intergrations/brasilapi/brasilapi.provider';
import { ViaCepProvider } from './intergrations/viacep/viacep.provider';
import { CEP_PROVIDERS } from './intergrations/cep-providers.tokens';
import { HttpModule } from '@nestjs/axios';
import { TimeoutResolutionStrategy } from './strategies/timeout-resolution.strategy';
import { RESOLUTION_STRATEGY } from './strategies/resolution-strategy.tokens';
import { RoundRobinProviderOrderStrategy } from './strategies/round-robin-provider-order.strategy';
import { PROVIDER_ORDER_STRATEGY } from './strategies/provider-order.tokens';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
          },
          ttl: 60 * 60 * 24 * 30 * 1000,
        }),
      }),
    }),
  ],
  controllers: [CepController],
  providers: [
    ViaCepProvider,
    BrasilApiProvider,
    HttpClientService,
    {
      provide: CEP_PROVIDERS,
      useFactory: (viaCep: ViaCepProvider, brasilApi: BrasilApiProvider) => [
        viaCep,
        brasilApi,
      ],
      inject: [ViaCepProvider, BrasilApiProvider],
    },
    TimeoutResolutionStrategy,
    { provide: RESOLUTION_STRATEGY, useExisting: TimeoutResolutionStrategy },
    RoundRobinProviderOrderStrategy,
    {
      provide: PROVIDER_ORDER_STRATEGY,
      useExisting: RoundRobinProviderOrderStrategy,
    },
    CepService,
  ],
})
export class CepModule {}
