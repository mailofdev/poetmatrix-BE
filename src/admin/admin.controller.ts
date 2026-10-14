import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service.js';
import { Content } from '../content/content.entity.js';
import { SearchIndex } from '../content/content.entity.js';
import { PublishUsage } from '../content/content.entity.js';
import { Enquiry } from '../community/community.entity.js';
import { Report } from '../engagement/engagement.entity.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { BlockedKeyword, SiteConfig } from '../platform/platform.entity.js';
import { PlatformService } from '../platform/platform.service.js';
import { DiscoveryService } from '../discovery/discovery.service.js';
import { User } from '../users/user.entity.js';
import { Plan, Role } from '../users/role.js';
import { UsersService } from '../users/users.service.js';

class PlanDto {
  @ApiProperty({ enum: Plan })
  @IsIn([Plan.Free, Plan.Basic, Plan.Pro])
  plan: Plan;
}

class NoteDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

class KeywordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  word: string;
}

class EnquiryStatusDto {
  @ApiProperty()
  @IsIn(['open', 'closed'])
  status: 'open' | 'closed';
}

class ConfigDto {
  @IsOptional() @IsString() @MaxLength(200) heroTitle?: string;
  @IsOptional() @IsString() @MaxLength(400) heroSubtitle?: string;
  @IsOptional() @IsString() aboutTeaser?: string;
  @IsOptional() @IsString() policiesNote?: string;
  @IsOptional() @IsString() @MaxLength(200) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(300) seoDescription?: string;
  @IsOptional() @IsBoolean() commentsGloballyEnabled?: boolean;
  @IsOptional() @IsBoolean() pushMasterEnabled?: boolean;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsBoolean() requireEmailVerification?: boolean;
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
  @IsOptional() @IsString() rolePolicyNotes?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.SuperAdmin)
@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Content) private readonly contents: Repository<Content>,
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(Enquiry) private readonly enquiries: Repository<Enquiry>,
    @InjectRepository(BlockedKeyword)
    private readonly keywords: Repository<BlockedKeyword>,
    @InjectRepository(SearchIndex)
    private readonly search: Repository<SearchIndex>,
    @InjectRepository(PublishUsage)
    private readonly usage: Repository<PublishUsage>,
    @InjectRepository(SiteConfig)
    private readonly configs: Repository<SiteConfig>,
    private readonly usersService: UsersService,
    private readonly activity: ActivityService,
    private readonly platform: PlatformService,
    private readonly discovery: DiscoveryService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [users, pieces, reports, enquiries] = await Promise.all([
      this.users.count(),
      this.contents.count(),
      this.reports.count({ where: { status: 'pending' } }),
      this.enquiries.count({ where: { status: 'open' } }),
    ]);
    return { users, pieces, reports, enquiries };
  }

  @Post('landing/refresh')
  refresh() {
    return this.discovery.refreshLanding();
  }

  @Get('users')
  listUsers(@Query('page') page = '1') {
    const current = Math.max(1, Number(page) || 1);
    return this.users.find({
      order: { createdAt: 'DESC' },
      skip: (current - 1) * 20,
      take: 20,
    }).then((rows) => rows.map((row) => this.usersService.toPublic(row)));
  }

  @Patch('users/:id/plan')
  async setPlan(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlanDto,
  ) {
    const saved = await this.usersService.setPlan(actor, id, dto.plan);
    await this.activity.record(actor.id, 'user_update', 'user', id);
    return saved;
  }

  @Get('content')
  content(@Query('page') page = '1') {
    const current = Math.max(1, Number(page) || 1);
    return this.contents.find({
      order: { updatedAt: 'DESC' },
      skip: (current - 1) * 20,
      take: 20,
    });
  }

  @Get('reports')
  reportList() {
    return this.reports.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  @Post('reports/:id/approve')
  async approve(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NoteDto,
  ) {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) {
      throw new BadRequestException('Report not found');
    }
    report.status = 'approved';
    report.moderatorId = actor.id;
    report.note = dto.note ?? '';
    report.moderatedAt = new Date();
    await this.reports.save(report);
    await this.activity.record(actor.id, 'moderation', 'report', id);
    return report;
  }

  @Post('reports/:id/reject')
  async reject(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NoteDto,
  ) {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) {
      throw new BadRequestException('Report not found');
    }
    report.status = 'rejected';
    report.moderatorId = actor.id;
    report.note = dto.note ?? '';
    report.moderatedAt = new Date();
    await this.reports.save(report);
    const piece = await this.contents.findOne({ where: { id: report.contentId } });
    if (piece) {
      piece.saveAs = 'draft';
      piece.visibility = 'private';
      await this.contents.save(piece);
      await this.search.delete({ contentId: piece.id });
      await this.usage.delete({
        contentId: piece.id,
        monthKey: new Date().toISOString().slice(0, 7),
      });
    }
    await this.activity.record(actor.id, 'moderation', 'report', id);
    return report;
  }

  @Get('keywords')
  keywordList() {
    return this.keywords.find();
  }

  @Post('keywords')
  addKeyword(@Body() dto: KeywordDto) {
    return this.keywords.save(this.keywords.create({ word: dto.word.trim() }));
  }

  @Get('enquiries')
  enquiryList() {
    return this.enquiries.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  @Patch('enquiries/:id')
  async enquiryStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnquiryStatusDto,
  ) {
    const row = await this.enquiries.findOne({ where: { id } });
    if (!row) {
      throw new BadRequestException('Enquiry not found');
    }
    row.status = dto.status;
    return this.enquiries.save(row);
  }

  @Get('activity')
  activityLog(@Query('page') page = '1') {
    return this.activity.list(Math.max(1, Number(page) || 1), 50);
  }

  @Get('config')
  config() {
    return this.platform.getConfig();
  }

  @Patch('config')
  async updateConfig(@Body() dto: ConfigDto) {
    const row = await this.platform.getConfig();
    Object.assign(row, dto);
    return this.configs.save(row);
  }
}

@ApiTags('site')
@Controller('site')
export class SiteController {
  constructor(private readonly platform: PlatformService) {}

  @Public()
  @Get()
  config() {
    return this.platform.publicConfig();
  }
}
