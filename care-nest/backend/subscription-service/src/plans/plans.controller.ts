import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ZodValidationPipe } from '@carenest/shared-utils';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PlansService } from './plans.service.js';
import { CreatePlanSchema, UpdatePlanSchema } from './dto/plans.dto.js';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /** Public — anyone can browse the plan catalog. */
  @Get()
  async list() {
    return this.plansService.list(true);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.plansService.getById(id);
  }

  @Get('by-code/:code')
  async getByCode(@Param('code') code: string) {
    return this.plansService.getByCode(code);
  }

  /** Admin endpoints — guarded by JWT, role checked in handler for now. */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body(new ZodValidationPipe(CreatePlanSchema)) dto: any) {
    return this.plansService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlanSchema)) dto: any,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Cần ít nhất một trường để cập nhật');
    }
    return this.plansService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/active')
  async setActive(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.plansService.setActive(id, !!body?.active);
  }
}
