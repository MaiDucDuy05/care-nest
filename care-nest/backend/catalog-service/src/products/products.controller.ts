import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductQuerySchema } from './dto/product-query.dto.js';
import { CreateProductSchema } from './dto/create-product.dto.js';
import { UpdateProductSchema } from './dto/update-product.dto.js';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(@Query() query: unknown) {
    const parsed = ProductQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.listProducts(parsed.data);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.createProduct(parsed.data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.updateProduct(id, parsed.data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
