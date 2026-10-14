import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { Content, PublishUsage, SearchIndex } from '../content/content.entity.js';
import { Enquiry } from '../community/community.entity.js';
import { DiscoveryModule } from '../discovery/discovery.module.js';
import { Report } from '../engagement/engagement.entity.js';
import { BlockedKeyword, SiteConfig } from '../platform/platform.entity.js';
import { PlatformModule } from '../platform/platform.module.js';
import { User } from '../users/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { AdminController, SiteController } from './admin.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Content,
      Report,
      Enquiry,
      BlockedKeyword,
      SearchIndex,
      PublishUsage,
      SiteConfig,
    ]),
    UsersModule,
    ActivityModule,
    PlatformModule,
    DiscoveryModule,
  ],
  controllers: [AdminController, SiteController],
})
export class AdminModule {}
