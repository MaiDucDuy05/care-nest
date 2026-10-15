import { Module, type Provider } from '@nestjs/common';
import { GhnProvider } from './ghn.provider.js';
import { GhtkProvider } from './ghtk.provider.js';
import { SHIPPING_PROVIDERS, ShippingProviderFactory } from './shipping-provider.factory.js';
import { type IShippingProvider } from './shipping-provider.interface.js';

// Instantiate singletons up-front so both the factory and the
// `GhnProvider` / `GhtkProvider` tokens point at the same instance.
const ghnInstance = new GhnProvider();
const ghtkInstance = new GhtkProvider();
const allProviders: IShippingProvider[] = [ghnInstance, ghtkInstance];

const providerTokens: Provider[] = [
  { provide: GhnProvider, useValue: ghnInstance },
  { provide: GhtkProvider, useValue: ghtkInstance },
  { provide: SHIPPING_PROVIDERS, useValue: allProviders },
  ShippingProviderFactory,
];

@Module({
  providers: providerTokens,
  exports: [ShippingProviderFactory, GhnProvider, GhtkProvider],
})
export class ProvidersModule {}
