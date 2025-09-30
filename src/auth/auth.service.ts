import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  private SALT_ROUNDS = 10;

  async register(email: string, password: string): Promise<CreateUserDto> {
    const existing = await this.userService.getUserByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashed = await bcrypt.hash(password, this.SALT_ROUNDS);
    const user = await this.userService.createUser(email, hashed);
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const { password: _, ...safe } = user as any;
    return safe;
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
