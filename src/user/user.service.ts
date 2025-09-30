import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // get all users
  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  // get user by id
  async getUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // get user by email
  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // create user
  async createUser(email: string, password: string) {
    return this.prisma.user.create({ data: { email, password } });
  }
}
