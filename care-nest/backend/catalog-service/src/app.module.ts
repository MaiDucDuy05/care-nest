import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';

@Module({
  imports: [ProductsModule, CategoriesModule],
})
export class AppModule {}
