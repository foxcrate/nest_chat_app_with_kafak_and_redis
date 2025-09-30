import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryParamsDto } from './dtos/query-params.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // get all users
  async getAllUsers(queryParams: QueryParamsDto) {
    const { page, limit, sortBy, sortOrder, search } = queryParams;
    const skip = (page - 1) * limit;

    // 🔎 search by email or (optionally add) name
    const where = search
      ? {
          OR: [{ email: { contains: search } }],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      records: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
