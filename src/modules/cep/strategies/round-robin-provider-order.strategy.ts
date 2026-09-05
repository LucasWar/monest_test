import { Injectable } from '@nestjs/common';
import type { ICepProvider } from '../interfaces/Icep.provider';
import type { IProviderOrderStrategy } from './interfaces/provider-order.strategy.interface';

@Injectable()
export class RoundRobinProviderOrderStrategy implements IProviderOrderStrategy {
  private startIndex = 0;

  getOrder(providers: ICepProvider[]): ICepProvider[] {
    if (providers.length === 0) return [];

    const order = [
      ...providers.slice(this.startIndex),
      ...providers.slice(0, this.startIndex),
    ];

    this.startIndex = (this.startIndex + 1) % providers.length;
    return order;
  }
}
