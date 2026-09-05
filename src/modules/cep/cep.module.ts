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
    CepService,
  ],
})
export class CepModule {}
