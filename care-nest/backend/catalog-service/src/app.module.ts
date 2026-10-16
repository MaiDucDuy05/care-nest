import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { KycModule } from './kyc/kyc.module.js';
import { ImeiModule } from './imei/imei.module.js';
import { PublicModule } from './public/public.module.js';

@Module({
  imports: [MetricsModule, HealthModule, ProductsModule, CategoriesModule, KycModule, ImeiModule, PublicModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
