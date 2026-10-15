import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { CartRepository } from './cart.repository.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'care-nest-jwt-secret-dev-2026',
    }),
  ],
  controllers: [CartController],
  providers: [CartService, CartRepository, JwtAuthGuard],
  exports: [CartService, CartRepository],
})
export class CartModule {}
