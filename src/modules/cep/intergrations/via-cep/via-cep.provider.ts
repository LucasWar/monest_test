import { Injectable } from '@nestjs/common';
import { HttpClientService } from 'src/common/http/http-client.service';
import { CepResult } from '../../interfaces/cep-result.interface';
import { ICepProvider } from '../../interfaces/Icep.provider';
import {
  ViaCepErrorResponse,
  ViaCepResponse,
} from './via-cep-response.interface';
import { CepNotFoundException } from 'src/common/exeptions/exeptions';

@Injectable()
export class ViaCepProvider implements ICepProvider {
  readonly name = 'viacep';

  constructor(private readonly http: HttpClientService) {}

  private isViaCepError(data: ViaCepResponse): data is ViaCepErrorResponse {
    return 'erro' in data && data.erro === true;
  }

  async fetch(cep: string): Promise<CepResult> {
    const data = await this.http.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${cep}/json/`,
    );

    if (this.isViaCepError(data)) {
      throw new CepNotFoundException(cep, this.name);
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  }
}
