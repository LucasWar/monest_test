import { Module } from '@nestjs/common';
import { CepService } from './cep.service';
import { CepController } from './cep.controller';
import { HttpClientService } from 'src/common/http/http-client.service';
import { BrasilApiProvider } from './intergrations/brasilapi/brasilapi.provider';
import { ViaCepProvider } from './intergrations/viacep/viacep.provider';
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
