import { Injectable, Logger } from '@nestjs/common';
import type { ICepProvider } from '../interfaces/Icep.provider';
import type { CepResult } from '../interfaces/cep-result.interface';
import { CepProviderTimeoutException } from 'src/common/exeptions/exeptions';
import { ICepResolutionStrategy } from './interfaces/cep-resolution.strategy.interface';

@Injectable()
export class TimeoutResolutionStrategy implements ICepResolutionStrategy {
  private readonly logger = new Logger(TimeoutResolutionStrategy.name);
  private readonly TIMEOUT_MS = 3000;

  async resolve(cep: string, provider: ICepProvider): Promise<CepResult> {
    try {
      const result = await this.withTimeout(
        provider.fetch(cep),
        this.TIMEOUT_MS,
      );
      this.logger.log(`CEP ${cep} resolvido via ${provider.name}`);
      return result;
    } catch (err) {
      const reason = this.getErrorMessage(err);
      this.logger.warn(
        `Provider ${provider.name} falhou para CEP ${cep}: ${reason}`,
      );
      throw err;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new CepProviderTimeoutException(ms)),
        ms,
      );
    });

    return Promise.race([promise, timeoutPromise]).finally(() =>
      clearTimeout(timeoutId),
    );
  }

  private getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
