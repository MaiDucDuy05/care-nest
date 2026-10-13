import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DevicesRepository } from './devices.repository.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';

@Injectable()
export class DevicesService {
  constructor(private readonly devicesRepository: DevicesRepository) {}

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
}
