import { Injectable, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import { CreateCategoryDto } from './dto/category.dto.js';

@Injectable()
export class CategoriesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async listCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục ${id}`);
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
      },
    });
  }
}
