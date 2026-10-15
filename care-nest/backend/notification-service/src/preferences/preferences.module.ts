import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller.js';
import { PreferencesService } from './preferences.service.js';
import { PreferencesRepository } from './preferences.repository.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Module({
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository, JwtAuthGuard],
  exports: [PreferencesService],
})
export class PreferencesModule {}
