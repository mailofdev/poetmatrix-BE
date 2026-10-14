import { randomBytes, randomUUID } from 'node:crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  hashPassword,
  verifyPassword,
} from '../common/security/password.js';
import {
  createOpaqueToken,
  decideRefresh,
  hashToken,
} from '../common/security/tokens.js';
import type { PublicUser } from '../common/types/auth-user.js';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { PasswordResetToken } from './password-reset-token.entity.js';
import { RefreshToken } from './refresh-token.entity.js';

const GENERIC_LOGIN = 'Invalid email or password';
const GENERIC_RESET =
  'If an account exists for that email, reset instructions have been issued';

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  user: PublicUser;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash: string | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
  ) {}

  register(input: {
    email: string;
    password: string;
    role?: string;
  }): Promise<PublicUser> {
    return this.usersService.create(input);
  }

  async login(email: string, password: string): Promise<IssuedSession> {
    const user = await this.usersService.findByEmail(email);
    const valid = user
      ? await verifyPassword(user.passwordHash, password)
      : await this.burnPasswordTime(password);
    if (!user || !valid) {
      throw new UnauthorizedException(GENERIC_LOGIN);
    }
    return this.issueSession(user, randomUUID());
  }

  async refresh(rawToken: string): Promise<IssuedSession> {
    const tokenHash = hashToken(rawToken);
    const outcome = await this.dataSource.transaction(
      async (
        manager,
      ): Promise<
        | { type: 'reuse'; familyId: string }
        | { type: 'session'; session: IssuedSession }
      > => {
        const tokens = manager.getRepository(RefreshToken);
        const existing = await tokens.findOne({
          where: { tokenHash },
          lock: { mode: 'pessimistic_write' },
        });
        const decision = decideRefresh(existing, new Date());
        if (decision === 'reuse' && existing) {
          return { type: 'reuse', familyId: existing.familyId };
        }
        if (decision !== 'rotate' || !existing) {
          throw new UnauthorizedException('Invalid session');
        }

        const user = await manager
          .getRepository(User)
          .findOne({ where: { id: existing.userId } });
        if (!user) {
          throw new UnauthorizedException('Invalid session');
        }

        const replacement = await this.saveRefreshToken(
          manager.getRepository(RefreshToken),
          user.id,
          existing.familyId,
        );
        existing.revokedAt = new Date();
        existing.replacedById = replacement.id;
        await tokens.save(existing);
        return {
          type: 'session',
          session: await this.toSession(user, replacement.rawToken),
        };
      },
    );
    if (outcome.type === 'reuse') {
      await this.refreshTokens.update(
        { familyId: outcome.familyId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Invalid session');
    }
    return outcome.session;
  }

  async logout(rawToken: string): Promise<void> {
    await this.refreshTokens.update(
      { tokenHash: hashToken(rawToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokens.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async forgotPassword(email: string): Promise<{
    message: string;
    developmentResetToken?: string;
  }> {
    this.logger.log('Password reset requested');
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.burnPasswordTime(email);
      return { message: GENERIC_RESET };
    }

    await this.resetTokens.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
    const rawToken = createOpaqueToken();
    const ttl = this.config.getOrThrow<number>('PASSWORD_RESET_TTL_SECONDS');
    await this.resetTokens.save(
      this.resetTokens.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttl * 1000),
        usedAt: null,
      }),
    );

    const result: { message: string; developmentResetToken?: string } = {
      message: GENERIC_RESET,
    };
    if (this.config.get<string>('NODE_ENV') === 'development') {
      result.developmentResetToken = rawToken;
    }
    return result;
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      const existing = await tokens.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !existing ||
        existing.usedAt ||
        existing.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException('Reset token is invalid or expired');
      }
      const users = manager.getRepository(User);
      const user = await users.findOne({ where: { id: existing.userId } });
      if (!user) {
        throw new UnauthorizedException('Reset token is invalid or expired');
      }
      user.passwordHash = await hashPassword(password);
      await users.save(user);
      existing.usedAt = new Date();
      await tokens.save(existing);
      await manager.getRepository(RefreshToken).update(
        { userId: user.id, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    });
  }

  me(userId: string): Promise<PublicUser> {
    return this.usersService.findById(userId).then((user) => {
      if (!user) {
        throw new UnauthorizedException('Authentication required');
      }
      return this.usersService.toPublic(user);
    });
  }

  private async issueSession(
    user: User,
    familyId: string,
  ): Promise<IssuedSession> {
    const refresh = await this.saveRefreshToken(
      this.refreshTokens,
      user.id,
      familyId,
    );
    return this.toSession(user, refresh.rawToken);
  }

  private async toSession(
    user: User,
    refreshToken: string,
  ): Promise<IssuedSession> {
    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
      }),
      refreshToken,
      accessExpiresIn: this.config.getOrThrow<number>(
        'JWT_ACCESS_TTL_SECONDS',
      ),
      refreshExpiresIn: this.config.getOrThrow<number>(
        'REFRESH_TOKEN_TTL_SECONDS',
      ),
      user: this.usersService.toPublic(user),
    };
  }

  private async saveRefreshToken(
    repository: Repository<RefreshToken>,
    userId: string,
    familyId: string,
  ): Promise<{ id: string; rawToken: string }> {
    const rawToken = createOpaqueToken();
    const ttl = this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_SECONDS');
    const saved = await repository.save(
      repository.create({
        userId,
        familyId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttl * 1000),
        revokedAt: null,
        replacedById: null,
      }),
    );
    return { id: saved.id, rawToken };
  }

  private async burnPasswordTime(password: string): Promise<false> {
    if (!this.dummyHash) {
      this.dummyHash = await hashPassword(randomBytes(24).toString('hex'));
    }
    await verifyPassword(this.dummyHash, password);
    return false;
  }
}
