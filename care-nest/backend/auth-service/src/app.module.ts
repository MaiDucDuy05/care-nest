import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MfaModule } from './mfa/mfa.module.js';
import { AuditModule } from './audit/audit.module.js';

@Module({
  imports: [AuthModule, UsersModule, MfaModule, AuditModule],
})
export class AppModule {}
