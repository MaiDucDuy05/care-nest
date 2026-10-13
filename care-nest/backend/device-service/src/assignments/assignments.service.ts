import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { getPrismaClient, PrismaClient } from '@carenest/database';
import { AssignDeviceDto } from './dto/assign-device.dto.js';

@Injectable()
export class AssignmentsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async assignDevice(dto: AssignDeviceDto) {
    const existingActive = await this.prisma.deviceAssignment.findFirst({
      where: {
        deviceId: dto.deviceId,
        unassignedAt: null,
      },
    });

    if (existingActive) {
      throw new ConflictException('Thiết bị này hiện đã được gán cho một người dùng khác');
    }

    return this.prisma.deviceAssignment.create({
      data: {
        deviceId: dto.deviceId,
        userId: dto.userId,
        notes: dto.notes,
      },
      include: {
        device: true,
        user: true,
      },
    });
  }

  async unassignDevice(assignmentId: string) {
    const assignment = await this.prisma.deviceAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Không tìm thấy lượt gán có id ${assignmentId}`);
    }

    return this.prisma.deviceAssignment.update({
      where: { id: assignmentId },
      data: { unassignedAt: new Date() },
    });
  }

  async getAssignmentsByUser(userId: string) {
    return this.prisma.deviceAssignment.findMany({
      where: { userId, unassignedAt: null },
      include: { device: true },
    });
  }
}
