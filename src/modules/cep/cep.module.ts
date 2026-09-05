import { Module } from '@nestjs/common';
import { CepService } from './cep.service';
import { CepController } from './cep.controller';
import { HttpClientService } from 'src/common/http/http-client.service';
import { BrasilApiProvider } from './intergrations/brasil-api/brasil-api.provider';
import { ViaCepProvider } from './intergrations/via-cep/via-cep.provider';
import { CEP_PROVIDERS } from './intergrations/cep-providers.tokens';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
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
