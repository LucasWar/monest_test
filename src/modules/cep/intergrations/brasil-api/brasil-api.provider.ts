import { Injectable } from '@nestjs/common';
import { HttpClientService } from 'src/common/http/http-client.service';
import { CepResult } from '../../interfaces/cep-result.interface';
import { ICepProvider } from '../../interfaces/Icep.provider';
import {
  BrasilApiErrorResponse,
  BrasilApiResponse,
} from './brasil-api-response.interface';
import { CepNotFoundException } from 'src/common/exeptions/exeptions';

@Injectable()
export class BrasilApiProvider implements ICepProvider {
  readonly name = 'brasilApi';

  constructor(private readonly http: HttpClientService) {}

  private isBrasilApiError(
    data: BrasilApiResponse,
  ): data is BrasilApiErrorResponse {
    return 'name' in data && data.name === 'CepPromiseError';
  }

  async fetch(cep: string): Promise<CepResult> {
    const data = await this.http.get<BrasilApiResponse>(
      `https://brasilapi.com.br/api/cep/v1/${cep}`,
    );

    if (this.isBrasilApiError(data)) {
      throw new CepNotFoundException(cep, this.name);
    }

    return {
      cep: data.cep,
      logradouro: data.street,
      bairro: data.neighborhood,
      cidade: data.city,
      uf: data.state,
    };
  }
}
