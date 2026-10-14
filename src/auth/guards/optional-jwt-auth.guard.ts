import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccessTokenService } from '../access-token.service.js';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.accessTokens.authenticate(
      context.switchToHttp().getRequest(),
    );
    return true;
  }
}
