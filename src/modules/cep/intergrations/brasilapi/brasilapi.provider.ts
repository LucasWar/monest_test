import { Injectable } from '@nestjs/common';
import { HttpClientService } from 'src/common/http/http-client.service';
import { CepResult } from '../../interfaces/cep-result.interface';
import { ICepProvider } from '../../interfaces/Icep.provider';

import {
  CepNotFoundException,
  CepProviderInvalidResponseException,
} from 'src/common/exeptions/exeptions';
import {
  BrasilApiErrorSchema,
  BrasilApiSuccessSchema,
} from './brasilapi-response.schema';

@Injectable()
export class BrasilApiProvider implements ICepProvider {
  readonly name = 'brasilApi';

  constructor(private readonly http: HttpClientService) {}

  async fetch(cep: string): Promise<CepResult> {
    const raw = await this.http.get<unknown>(
      `https://brasilapi.com.br/api/cep/v1/${cep}`,
    );

    const errorParsed = BrasilApiErrorSchema.safeParse(raw);
    if (errorParsed.success) {
      throw new CepNotFoundException(cep, this.name);
    }

    const successParsed = BrasilApiSuccessSchema.safeParse(raw);
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
      logradouro: data.street,
      bairro: data.neighborhood,
      cidade: data.city,
      uf: data.state,
    };
  }
}
