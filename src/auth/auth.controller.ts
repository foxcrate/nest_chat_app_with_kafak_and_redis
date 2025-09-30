import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { GetUser } from './decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { CompleteUserDto } from './dto/complete-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<CreateUserDto> {
    const user = await this.authService.register(dto.email, dto.password);
    // Do not return password
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    const token = await this.authService.login(dto.email, dto.password);
    return { access_token: token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: any): CompleteUserDto {
    // `user` is the JWT payload; include maybe id/email
    return user;
  }
}
