import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { canAssignRole } from '../common/authorization/content-access.js';
import { hashPassword } from '../common/security/password.js';
import type { AuthUser, PublicUser } from '../common/types/auth-user.js';
import { User } from './user.entity.js';
import { registrationRole, Role } from './role.js';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.config.get<string>('SUPER_ADMIN_PASSWORD');
    if (!email || !password) {
      return;
    }

    const existing = await this.findByEmail(email);
    if (existing) {
      return;
    }

    await this.users.save(
      this.users.create({
        email,
        passwordHash: await hashPassword(password),
        role: Role.SuperAdmin,
      }),
    );
    this.logger.log('Super admin account created from environment');
  }

  async create(input: {
    email: string;
    password: string;
    role?: string;
  }): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    let role: Role;
    try {
      role = registrationRole(input.role);
    } catch {
      throw new ForbiddenException('Role is not available for registration');
    }

    try {
      const saved = await this.users.save(
        this.users.create({
          email,
          passwordHash: await hashPassword(input.password),
          role,
        }),
      );
      return this.toPublic(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'An account with that email already exists',
        );
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async updateRole(
    actor: AuthUser,
    userId: string,
    nextRole: Role,
  ): Promise<PublicUser> {
    const target = await this.findById(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    const superAdminCount = await this.users.count({
      where: { role: Role.SuperAdmin },
    });
    if (
      !canAssignRole({
        actor,
        target: { id: target.id, role: target.role },
        nextRole,
        superAdminCount,
      })
    ) {
      throw new ForbiddenException('Role change was rejected');
    }
    target.role = nextRole;
    return this.toPublic(await this.users.save(target));
  }

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'driverError' in error &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        '23505'
    );
  }
}
