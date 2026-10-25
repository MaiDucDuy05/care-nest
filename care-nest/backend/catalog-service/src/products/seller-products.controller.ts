import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { Product } from '@carenest/database';
import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { PaginatedProducts } from './products.repository.js';
import { CreateProductSchema } from './dto/create-product.dto.js';
import { UpdateProductSchema } from './dto/update-product.dto.js';
import { storeProductImage } from './product-image-storage.js';

@Controller('seller/products')
@UseGuards(JwtAuthGuard)
export class SellerProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Req() request: Request,
  ): Promise<{ url: string }> {
    await this.productsService.assertSeller(user.id);
    if (!file) throw new BadRequestException('Choose an image to upload.');
    return storeProductImage(file, request);
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() query: any,
  ): Promise<PaginatedProducts> {
    return this.productsService.listForSeller(user.id, query);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productsService.getForSeller(user.id, id);
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: unknown,
  ): Promise<Product> {
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.productsService.createForSeller(user.id, parsed.data);
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

