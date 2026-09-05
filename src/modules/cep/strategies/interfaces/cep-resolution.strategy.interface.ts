import type { ICepProvider } from '../../interfaces/Icep.provider';
import type { CepResult } from '../../interfaces/cep-result.interface';

export interface ICepResolutionStrategy {
  resolve(cep: string, provider: ICepProvider): Promise<CepResult>;
}
