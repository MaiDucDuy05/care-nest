import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DevicesService } from './devices.service.js';
import { RegisterDeviceSchema } from './dto/register-device.dto.js';
import { AssignmentsService } from '../assignments/assignments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyDevices(@CurrentUser() user: { id: string }) {
    const assignments = await this.assignmentsService.getAssignmentsByUser(user.id);
    return assignments.map((a) => a.device);
  }

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.devicesService.listDevices(parseInt(page, 10), parseInt(pageSize, 10));
  }

  @Get(':id/telemetry/latest')
  async getLatestVitals(@Param('id') id: string) {
    return this.devicesService.getLatestVitals(id);
  }

  @Get(':id/telemetry')
  async getTelemetryHistory(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '50',
  ) {
    return this.devicesService.getTelemetryHistory(id, from, to, parseInt(limit, 10));
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

  /**
   * Admin-only provisioning endpoint. S16: this is the entry point
   * for onboarding a new IMEI into the system.
   */
  @Post()
  async provision(@Body() body: { deviceId: string; model?: string; firmware?: string }) {
    if (!body?.deviceId) throw new BadRequestException('deviceId is required');
    return this.devicesService.provision(body.deviceId, body.model, body.firmware);
  }

  /**
   * Issue an activation code for a delivered order. The buyer redeems
   * the returned token from the activation page.
   */
  @Post(':id/activate')
  async issueActivation(
    @Param('id') _id: string,
    @Body() body: { orderId: string; userId: string; imeiList: string[] }
  ): Promise<{ id: string; token: string; expiresAt: string }> {
    if (!body?.orderId || !body?.userId || !Array.isArray(body.imeiList)) {
      throw new BadRequestException('orderId, userId, and imeiList are required');
    }
    const code = await this.devicesService.issueActivationCode(body.orderId, body.userId, body.imeiList);
    return {
      id: code.id,
      token: code.token,
      expiresAt: code.expiresAt.toISOString(),
    };
  }
}
