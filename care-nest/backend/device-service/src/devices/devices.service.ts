import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DevicesRepository } from './devices.repository.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import { ActivationService } from '../activation/activation.service.js';
import type { Device, DeviceActivationCode } from '@carenest/database';

@Injectable()
export class DevicesService {
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly activationService: ActivationService
  ) {}

  async listDevices(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.devicesRepository.findMany(skip, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  async getDeviceById(id: string) {
    const device = await this.devicesRepository.findById(id);
    if (!device) {
      throw new NotFoundException(`Không tìm thấy thiết bị có id ${id}`);
    }
    return device;
  }

  async registerDevice(dto: RegisterDeviceDto) {
    const existing = await this.devicesRepository.findByImei(dto.deviceId);
    if (existing) {
      throw new ConflictException(`Thiết bị với IMEI ${dto.deviceId} đã tồn tại`);
    }
    return this.devicesRepository.create(dto);
  }

  async updateHeartbeat(deviceId: string, battery?: number) {
    return this.devicesRepository.updateHeartbeat(deviceId, battery);
  }

  /**
   * Admin-only provisioning. Delegates to ActivationService for IMEI
   * validation + DB-side uniqueness check. Returns the created Device.
   */
  async provision(deviceId: string, model?: string, firmware?: string): Promise<Device> {
    return this.activationService.provisionDevice({ deviceId, model, firmware });
  }

  /**
   * Issue an activation code for a delivered order. The buyer redeems
   * the returned token from the activation page. Multiple IMEIs per
   * code are supported so a single order with N devices produces one
   * code that binds all of them.
   */
  async issueActivationCode(
    orderId: string,
    userId: string,
    imeiList: string[]
  ): Promise<DeviceActivationCode> {
    if (!orderId) throw new BadRequestException('orderId is required');
    if (!userId) throw new BadRequestException('userId is required');
    return this.activationService.createActivationCode({ orderId, userId, imeiList });
  }

  async getLatestVitals(idOrImei: string) {
    return this.devicesRepository.getLatestVitals(idOrImei);
  }

  async getTelemetryHistory(idOrImei: string, from?: string, to?: string, limit = 50) {
    return this.devicesRepository.getTelemetryHistory(idOrImei, from, to, limit);
  }
}
