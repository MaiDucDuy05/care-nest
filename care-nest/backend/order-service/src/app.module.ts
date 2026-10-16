import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsModule, HealthModule, RequestMetricsMiddleware } from '@carenest/nestjs-common';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    CartModule,
    OrdersModule,
    InventoryModule,
    AnalyticsModule,
    ReviewsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
