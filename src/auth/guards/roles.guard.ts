// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // console.log('roles guard');

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // console.log('requiredRoles: ', requiredRoles);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    // console.log('request.user: ', request.user);

    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('You do not have the required role');
    }

    return true;
  }
}
