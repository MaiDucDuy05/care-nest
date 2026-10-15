import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service.js';
import { MfaController } from './mfa.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
