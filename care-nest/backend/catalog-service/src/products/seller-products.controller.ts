import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Product } from '@carenest/database';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { PaginatedProducts } from './products.repository.js';
import { UpdateProductSchema } from './dto/update-product.dto.js';

@Controller('seller/products')
@UseGuards(JwtAuthGuard)
export class SellerProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: any,
  ): Promise<PaginatedProducts> {
    return this.productsService.listForSeller(user.id, query);
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: any,
  ): Promise<Product> {
    return this.productsService.createForSeller(user.id, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<Product> {
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.updateForSeller(user.id, id, parsed.data);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productsService.deleteForSeller(user.id, id);
  }
}

