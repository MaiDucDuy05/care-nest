import { Controller, Get, Post, Param, Query, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@carenest/database';
import { OrdersService } from './orders.service.js';
import { CheckoutSchema, UpdateOrderStatusSchema } from './dto/order.dto.js';
import { JwtAuthGuard } from '../cart/guards/jwt-auth.guard.js';
import { CurrentUser } from '../cart/decorators/current-user.decorator.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.ordersService.checkout(user.id, parsed.data);
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string; role?: string },
    @Query('sellerId') sellerId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<any> {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 20, 100);
    if (sellerId) {
      return this.ordersService.listForSeller(sellerId, p, ps);
    }
    return this.ordersService.listForBuyer(user.id, p, ps);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: { id: string; role?: string }, @Param('id') id: string): Promise<any> {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPPORT';
    return this.ordersService.getOrder(user.id, id, isAdmin);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser() user: { id: string; role?: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<any> {
    const parsed = UpdateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    // Authorization: sellers can move their orders forward; admins/support can do anything.
    if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      const order = await this.ordersService.getOrder(user.id, id, false);
      if (order.sellerId !== user.id) {
        throw new NotFoundException(`Không tìm thấy đơn hàng ${id}`);
      }
    }
    return this.ordersService.updateStatus(id, parsed.data);
  }
}
