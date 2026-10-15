import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { AddToCartSchema, UpdateCartItemSchema } from './dto/cart-item.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('api/v1/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: { id: string }) {
    const cart = await this.cartService.getCart(user.id);
    return { ...cart, grouped: this.cartService.groupBySeller(cart) };
  }

  @Post('items')
  async addItem(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = AddToCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.cartService.addItem(user.id, parsed.data);
  }

  @Put('items/:productId')
  async updateItem(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.cartService.updateItem(user.id, productId, parsed.data);
  }

  @Delete('items/:productId')
  async removeItem(@CurrentUser() user: { id: string }, @Param('productId') productId: string) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  async clear(@CurrentUser() user: { id: string }) {
    await this.cartService.clearCart(user.id);
    return { ok: true };
  }
}
