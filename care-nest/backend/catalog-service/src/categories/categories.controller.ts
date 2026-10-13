import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategorySchema } from './dto/category.dto.js';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list() {
    return this.categoriesService.listCategories();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.categoriesService.createCategory(parsed.data);
  }
}
