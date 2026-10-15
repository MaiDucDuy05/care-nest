import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { KycModule } from './kyc/kyc.module.js';

@Module({
  imports: [ProductsModule, CategoriesModule, KycModule],
})
export class AppModule {}
