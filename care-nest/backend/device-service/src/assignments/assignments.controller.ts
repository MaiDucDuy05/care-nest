import { Controller, Post, Delete, Get, Param, Body, BadRequestException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';
import { AssignDeviceSchema } from './dto/assign-device.dto.js';

@Controller('api/v1/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async assign(@Body() body: unknown) {
    const parsed = AssignDeviceSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.assignmentsService.assignDevice(parsed.data);
  }

  @Delete(':id')
  async unassign(@Param('id') id: string) {
    return this.assignmentsService.unassignDevice(id);
  }

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    return this.assignmentsService.getAssignmentsByUser(userId);
  }
}
