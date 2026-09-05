import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AllProvidersUnavailableException,
  CepNotFoundException,
  CepProviderTimeoutException,
} from 'src/common/exeptions/exeptions';
import { CepResult } from './interfaces/cep-result.interface';
import { CEP_PROVIDERS } from './intergrations/cep-providers.tokens';
import { ICepProvider } from './interfaces/Icep.provider';

@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private requestCount = 0;

  constructor(
    @Inject(CEP_PROVIDERS) private readonly providers: ICepProvider[],
  ) {}

  async findByCep(cep: string): Promise<CepResult> {
    const order = this.getProviderOrder();
    const errors: { provider: string; reason: string }[] = [];

    for (const provider of order) {
      try {
        const result = await this.withTimeout(provider.fetch(cep), 3000);
        this.logger.log(`CEP ${cep} resolvido via ${provider.name}`);
        return result;
      } catch (err) {
        const reason = this.getErrorMessage(err);
        errors.push({ provider: provider.name, reason });
        this.logger.warn(
          `Provider ${provider.name} falhou para CEP ${cep}: ${reason}`,
        );

        if (err instanceof CepNotFoundException) throw err;
        continue;
      }
    }

    throw new AllProvidersUnavailableException(cep, errors);
  }

  private getProviderOrder(): ICepProvider[] {
    const startIndex = this.requestCount % this.providers.length;
    this.requestCount++;

    return [
      ...this.providers.slice(startIndex),
      ...this.providers.slice(0, startIndex),
    ];
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new CepProviderTimeoutException(ms)), ms),
      ),
    ]);
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }
}
