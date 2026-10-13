import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { DevicesService } from './devices.service.js';
import { RegisterDeviceSchema } from './dto/register-device.dto.js';

@Controller('api/v1/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.devicesService.listDevices(parseInt(page, 10), parseInt(pageSize, 10));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Post('register')
  async register(@Body() body: unknown) {
    const parsed = RegisterDeviceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.devicesService.registerDevice(parsed.data);
  }
}
