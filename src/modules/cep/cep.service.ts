import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  AllProvidersUnavailableException,
  CepNotFoundException,
  CepProviderTimeoutException,
} from 'src/common/exeptions/exeptions';
import { CepResult } from './interfaces/cep-result.interface';
import { ICepProvider } from './interfaces/Icep.provider';
import { CEP_PROVIDERS } from './intergrations/cep-providers.tokens';

@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private requestCount = 0;

  constructor(
    @Inject(CEP_PROVIDERS) private readonly providers: ICepProvider[],
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findByCep(cep: string): Promise<CepResult> {
    const cacheKey = `cep:${cep}`;

    const cached = await this.cache.get<CepResult>(cacheKey);
    if (cached) {
      this.logger.log(`CEP ${cep} resolvido via cache`);
      return cached;
    }

    const result = await this.fetchFromProviders(cep);
    await this.cache.set(cacheKey, result);

    return result;
  }

  private async fetchFromProviders(cep: string): Promise<CepResult> {
    const order = this.getProviderOrder();
    const errors: { provider: string; reason: string }[] = [];
    let anyNotFound = false;

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

        if (err instanceof CepNotFoundException) {
          anyNotFound = true;
        }
        continue;
      }
    }

    if (anyNotFound) {
      throw new CepNotFoundException(cep, 'all');
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
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new CepProviderTimeoutException(ms)),
        ms,
      );
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }
}
