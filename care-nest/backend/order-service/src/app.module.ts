import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { InventoryModule } from './inventory/inventory.module.js';

@Module({
  imports: [CartModule, OrdersModule, InventoryModule],
})
export class AppModule {}
