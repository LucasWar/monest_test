// providers/viacep/viacep.provider.ts
import { Injectable } from '@nestjs/common';
import { HttpClientService } from 'src/common/http/http-client.service';
import { CepResult } from '../../interfaces/cep-result.interface';
import { ICepProvider } from '../../interfaces/Icep.provider';
import {
  ViaCepSuccessSchema,
  ViaCepErrorSchema,
} from './viacep-response.schema';
import {
  CepNotFoundException,
  CepProviderInvalidResponseException,
} from 'src/common/exeptions/exeptions';

@Injectable()
export class ViaCepProvider implements ICepProvider {
  readonly name = 'viacep';

  constructor(private readonly http: HttpClientService) {}

  async fetch(cep: string): Promise<CepResult> {
    const raw = await this.http.get<unknown>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );

    const errorParsed = ViaCepErrorSchema.safeParse(raw);
    if (errorParsed.success) {
      throw new CepNotFoundException(cep, this.name);
    }

    const successParsed = ViaCepSuccessSchema.safeParse(raw);
    if (!successParsed.success) {
      throw new CepProviderInvalidResponseException(
        this.name,
        successParsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      );
    }

    const data = successParsed.data;

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  }
}
