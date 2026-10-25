import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@carenest/database';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng có id ${id}`);
    }
    return user;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    phone?: string;
    fullName: string;
    role: any;
  }) {
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }
    return this.usersRepository.create(data);
  }

  async updateLastLogin(id: string) {
    return this.usersRepository.updateLastLogin(id);
  }

  async listForAdmin(query: { page: number; limit: number; search?: string; role?: string; status?: string }) {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) {
      if (!Object.values(UserRole).includes(query.role as UserRole)) {
        throw new BadRequestException(`Unsupported user role: ${query.role}`);
      }
      where.role = query.role as UserRole;
    }
    if (query.status) {
      const status = query.status === 'PENDING' ? UserStatus.PENDING_VERIFICATION : query.status;
      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        throw new BadRequestException(`Unsupported user status: ${query.status}`);
      }
      where.status = status as UserStatus;
    }

    const { data, total } = await this.usersRepository.listForAdmin({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  async getForAdmin(id: string) {
    const user = await this.usersRepository.findAdminDetail(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async suspendForAdmin(id: string, actorId: string, reason: string) {
    if (id === actorId) throw new ForbiddenException('You cannot suspend your own account');
    await this.findById(id);
    const user = await this.usersRepository.updateStatus(id, UserStatus.SUSPENDED);
    return { success: true, reason, user };
  }

  async unsuspendForAdmin(id: string) {
    await this.findById(id);
    const user = await this.usersRepository.updateStatus(id, UserStatus.ACTIVE);
    return { success: true, user };
  }

  async updateRoleForAdmin(id: string, actorId: string, role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException(`Unsupported user role: ${role}`);
    }
    if (id === actorId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot remove your own admin role');
    }
    await this.findById(id);
    const user = await this.usersRepository.updateRole(id, role);
    return { success: true, user };
  }
}
