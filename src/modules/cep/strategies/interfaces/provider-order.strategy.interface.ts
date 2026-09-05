import { ICepProvider } from '../../interfaces/Icep.provider';

export interface IProviderOrderStrategy {
  getOrder(providers: ICepProvider[]): ICepProvider[];
}
