import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import type { AuthUser } from '../common/types/auth-user.js';

type RequestWithUser = {
  headers: { authorization?: string };
  user?: AuthUser;
};

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async authenticate(request: RequestWithUser): Promise<AuthUser | null> {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(
        token,
      );
      if (!payload.sub) {
        return null;
      }
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        return null;
      }
      const authUser = this.usersService.toAuth(user);
      request.user = authUser;
      return authUser;
    } catch {
      return null;
    }
  }

  require(request: RequestWithUser): Promise<AuthUser> {
    return this.authenticate(request).then((user) => {
      if (!user) {
        throw new UnauthorizedException('Authentication required');
      }
      return user;
    });
  }
}
