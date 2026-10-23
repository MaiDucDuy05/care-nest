import { Controller, Get, Post, Param, Body, UseGuards, BadRequestException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentSchema, RefundPaymentSchema } from './dto/payment.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CreatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.paymentsService.createPayment(user.id, parsed.data);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('id') id: string) {
    return this.paymentsService; // placeholder for find
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refund(@Param('id') id: string, @Body() body: unknown) {
    const parsed = RefundPaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.paymentsService.refund(id, parsed.data);
  }
}
