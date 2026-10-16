import { Module } from '@nestjs/common';
import { ImeiController } from './imei.controller.js';
import { ImeiService } from './imei.service.js';
import { ImeiRepository } from './imei.repository.js';
import { ImeiEventPublisher } from './imei-event.publisher.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [ImeiController],
  providers: [ImeiService, ImeiRepository, ImeiEventPublisher, JwtAuthGuard],
  exports: [ImeiService, ImeiRepository],
})
export class ImeiModule {}
