import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  CepProviderTimeoutException,
  CepProviderUnavailableException,
} from '../exeptions/exeptions';
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(private readonly httpService: HttpService) {}

  async get<T>(url: string, timeoutMs = 3000): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, { timeout: timeoutMs }),
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError;

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new CepProviderTimeoutException(timeoutMs);
      }

      this.logger.warn(`Falha HTTP em ${url}: ${error.message}`);
      throw new CepProviderUnavailableException(error.message);
    }
  }
}
