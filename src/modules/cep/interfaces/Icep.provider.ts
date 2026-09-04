import { CepResult } from './cep-result.interface';

export interface ICepProvider {
  readonly name: string;
  fetch(cep: string): Promise<CepResult>;
}
