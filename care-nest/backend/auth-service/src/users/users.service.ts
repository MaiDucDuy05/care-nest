import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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
}
