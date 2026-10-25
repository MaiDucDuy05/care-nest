import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { SellerProductsController } from './seller-products.controller.js';
import { ProductsService } from './products.service.js';
import { ProductsRepository } from './products.repository.js';
import { RolesGuard } from '@carenest/nestjs-common';

@Module({
  controllers: [ProductsController, SellerProductsController],
  providers: [ProductsService, ProductsRepository, RolesGuard],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
