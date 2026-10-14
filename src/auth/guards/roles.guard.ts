import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import { resolveActor } from '../../users/account-rules.js';
import { Role } from '../../users/role.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser }>();
    const user = request.user;
    const actor = user ? resolveActor(user) : 'guest';
    const allowed = required.some((role) => {
      if (role === Role.Admin || role === Role.SuperAdmin) {
        return actor === 'superadmin';
      }
      if (role === Role.Writer) {
        return actor === 'writer' || actor === 'superadmin';
      }
      return actor === 'reader' || actor === 'writer';
    });
    if (!user || !allowed) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    return true;
  }
}
