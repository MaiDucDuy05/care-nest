import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [
    CartModule,
    OrdersModule,
    InventoryModule,
    AnalyticsModule,
    ReviewsModule,
  ],
})
export class AppModule {}
