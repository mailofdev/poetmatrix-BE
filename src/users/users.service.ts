import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
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
import { ActivityService } from '../activity/activity.service.js';
import { canAssignRole } from '../common/authorization/content-access.js';
import { hashPassword, verifyPassword } from '../common/security/password.js';
import type { AuthUser, PublicUser } from '../common/types/auth-user.js';
import {
  becomeWriterPatch,
  canSwitchMode,
  Mode,
  normalizePlan,
  normalizeRole,
  ownerBillingChangeRejected,
  Plan,
  registrationDefaults,
  Role,
  toPublicProfile,
  validateBecomeWriter,
  type BecomeWriterInput,
} from './account-rules.js';
import { User } from './user.entity.js';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly activity: ActivityService,
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
    const defaults = registrationDefaults();
    await this.users.save(
      this.users.create({
        email,
        passwordHash: await hashPassword(password),
        ...defaults,
        role: Role.SuperAdmin,
        roles: [Role.SuperAdmin],
      }),
    );
    this.logger.log('Super admin account created from environment');
  }

  async create(input: {
    email: string;
    password: string;
    role?: string;
    displayName?: string;
  }): Promise<PublicUser> {
    if (input.role && input.role !== Role.Reader) {
      throw new ForbiddenException('Role is not available for registration');
    }
    return this.insertAccount({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName ?? null,
    });
  }

  async createFromGoogle(input: {
    email: string;
    displayName?: string;
  }): Promise<{ user: PublicUser; created: boolean }> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      return { user: this.toPublic(existing), created: false };
    }
    const user = await this.insertAccount({
      email: input.email,
      passwordHash: await hashPassword(randomBytes(32).toString('hex')),
      displayName: input.displayName ?? null,
    });
    return { user, created: true };
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
    const target = await this.requireUser(userId);
    const superAdminCount = await this.users.count({
      where: { role: Role.SuperAdmin },
    });
    if (
      !canAssignRole({
        actor,
        target: { id: target.id, role: normalizeRole(target.role) },
        nextRole,
        superAdminCount,
      })
    ) {
      throw new ForbiddenException('Role change was rejected');
    }
    target.role = nextRole;
    return this.toPublic(await this.users.save(target));
  }

  async updateProfile(
    userId: string,
    input: {
      displayName?: string;
      phone?: string;
      gender?: string;
      bio?: string;
      penName?: string;
    },
  ): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    if (input.displayName !== undefined) {
      user.displayName = input.displayName.trim();
    }
    if (input.phone !== undefined) {
      user.phone = input.phone.trim() || null;
    }
    if (input.gender !== undefined) {
      user.gender = input.gender.trim();
    }
    if (input.bio !== undefined) {
      user.bio = input.bio;
    }
    if (input.penName !== undefined) {
      user.penName = input.penName.trim();
    }
    return this.toPublic(await this.users.save(user));
  }

  async setPhoto(userId: string, photoPath: string): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    user.photoPath = photoPath;
    return this.toPublic(await this.users.save(user));
  }

  async setMode(actor: AuthUser, mode: Mode): Promise<PublicUser> {
    const user = await this.requireUser(actor.id);
    if (!canSwitchMode(user, mode)) {
      throw new ForbiddenException('That mode is not available');
    }
    user.mode = mode;
    return this.toPublic(await this.users.save(user));
  }

  async becomeWriter(
    actor: AuthUser,
    input: BecomeWriterInput,
  ): Promise<PublicUser> {
    const user = await this.requireUser(actor.id);
    const problem = validateBecomeWriter(user, input);
    if (problem) {
      throw new BadRequestException(problem);
    }
    const patch = becomeWriterPatch(user.plan);
    user.displayName = input.fullName.trim();
    user.penName = input.penName.trim();
    user.bio = input.bio;
    user.phone = input.phone?.trim() || null;
    user.gender = input.gender.trim();
    user.role = patch.role;
    user.roles = patch.roles;
    user.mode = patch.mode;
    user.readerSubscription = patch.readerSubscription;
    user.writerSubscription = patch.writerSubscription;
    user.plan = patch.plan;
    const saved = await this.users.save(user);
    await this.activity.record(saved.id, 'became_writer', 'user', saved.id);
    return this.toPublic(saved);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    nextPassword: string,
  ): Promise<void> {
    const user = await this.requireUser(userId);
    const matches = await verifyPassword(user.passwordHash, currentPassword);
    if (!matches) {
      throw new ForbiddenException('Current password is incorrect');
    }
    user.passwordHash = await hashPassword(nextPassword);
    await this.users.save(user);
  }

  async setPreferences(
    userId: string,
    input: { theme?: string; pushEnabled?: boolean },
  ): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    if (
      input.theme &&
      (input.theme === 'system' ||
        input.theme === 'light' ||
        input.theme === 'dark')
    ) {
      user.theme = input.theme;
    }
    if (input.pushEnabled !== undefined) {
      user.pushEnabled = input.pushEnabled;
    }
    return this.toPublic(await this.users.save(user));
  }

  async setInterests(
    userId: string,
    genres: string[],
  ): Promise<PublicUser> {
    const user = await this.requireUser(userId);
    user.interests = genres;
    user.interestsCompleted = true;
    return this.toPublic(await this.users.save(user));
  }

  async setPlan(
    actor: AuthUser,
    userId: string,
    plan: Plan,
  ): Promise<PublicUser> {
    if (ownerBillingChangeRejected(actor.id, userId)) {
      throw new ForbiddenException('You cannot change your own plan');
    }
    const user = await this.requireUser(userId);
    user.plan = normalizePlan(plan);
    if (user.plan !== Plan.Free) {
      user.writerSubscription = true;
      user.readerSubscription = true;
    }
    return this.toPublic(await this.users.save(user));
  }

  async applyPaidPlan(userId: string, plan: Plan): Promise<void> {
    const user = await this.requireUser(userId);
    user.plan = plan;
    if (plan !== Plan.Free) {
      user.writerSubscription = true;
      user.readerSubscription = true;
      if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
        user.role = Role.Writer;
        user.roles = [Role.Reader, Role.Writer];
      }
    }
    await this.users.save(user);
  }

  async publicProfile(id: string) {
    const user = await this.requireUser(id);
    return {
      ...toPublicProfile(user),
      followerCount: user.followerCount,
      followingCount: user.followingCount,
    };
  }

  toAuth(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      mode: user.mode === Mode.Writer ? Mode.Writer : Mode.Reader,
      plan: normalizePlan(user.plan),
      readerSubscription: user.readerSubscription,
      writerSubscription: user.writerSubscription,
    };
  }

  toPublic(user: User): PublicUser {
    return {
      ...this.toAuth(user),
      displayName: user.displayName,
      penName: user.penName,
      bio: user.bio,
      phone: user.phone,
      gender: user.gender,
      photo: user.photoPath,
      interests: user.interests ?? [],
      interestsCompleted: user.interestsCompleted,
      pushEnabled: user.pushEnabled,
      theme: user.theme,
      createdAt: user.createdAt,
    };
  }

  private async insertAccount(input: {
    email: string;
    passwordHash: string;
    displayName: string | null;
  }): Promise<PublicUser> {
    const defaults = registrationDefaults();
    try {
      const saved = await this.users.save(
        this.users.create({
          email: input.email.trim().toLowerCase(),
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          ...defaults,
          interests: [],
          interestsCompleted: false,
          pushEnabled: false,
          theme: 'system',
          followerCount: 0,
          followingCount: 0,
          phone: null,
          gender: null,
          bio: null,
          penName: null,
          photoPath: null,
        }),
      );
      await this.activity.record(saved.id, 'user_create', 'user', saved.id);
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

  private async requireUser(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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
