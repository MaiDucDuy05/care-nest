import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PlansRepository } from './plans.repository.js';
import type { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto.js';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly plansRepository: PlansRepository) {}

  async list(activeOnly = false) {
    return this.plansRepository.findAll(activeOnly);
  }

  async getById(id: string) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) throw new NotFoundException(`Không tìm thấy plan ${id}`);
    return plan;
  }

  async getByCode(code: string) {
    const plan = await this.plansRepository.findByCode(code);
    if (!plan) throw new NotFoundException(`Không tìm thấy plan "${code}"`);
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const plan = await this.plansRepository.create(dto);
    this.logger.log({ planId: plan.id, code: plan.code }, 'Plan created');
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    return this.plansRepository.update(id, dto);
  }

  async setActive(id: string, active: boolean) {
    return this.plansRepository.setActive(id, active);
  }
}
