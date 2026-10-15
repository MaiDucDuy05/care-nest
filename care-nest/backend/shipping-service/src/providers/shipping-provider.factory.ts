import { Injectable, Inject } from '@nestjs/common';
import { type CarrierCode, type IShippingProvider } from './shipping-provider.interface.js';

export const SHIPPING_PROVIDERS = Symbol('SHIPPING_PROVIDERS');

/**
 * Factory that picks a provider by code. Used by ShipmentsService so the
 * controller never imports a concrete carrier directly.
 *
 *   get('GHN')  → GhnProvider
 *   get('GHTK') → GhtkProvider
 *
 * If you add a new carrier, register it in ProvidersModule.providers and
 * extend the `map` below — no other file needs to change.
 */
@Injectable()
export class ShippingProviderFactory {
  private readonly providers: Map<CarrierCode, IShippingProvider>;

  constructor(
    @Inject(SHIPPING_PROVIDERS) providers: IShippingProvider[],
  ) {
    this.providers = new Map(providers.map((p) => [p.carrierCode, p]));
  }

  get(code: CarrierCode): IShippingProvider {
    const p = this.providers.get(code);
    if (!p) {
      throw new Error(`Unknown shipping provider: ${code}`);
    }
    return p;
  }

  /** First available provider, or null if none registered. */
  getDefault(): IShippingProvider | null {
    const code = (process.env.DEFAULT_PROVIDER as CarrierCode) || 'GHN';
    return this.providers.get(code) ?? this.providers.values().next().value ?? null;
  }

  list(): CarrierCode[] {
    return Array.from(this.providers.keys());
  }
}
