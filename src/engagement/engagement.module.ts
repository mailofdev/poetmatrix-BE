import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { Content } from '../content/content.entity.js';
import { ContentModule } from '../content/content.module.js';
import {
  Challenge,
  ChallengeCredit,
  ChallengeProgress,
} from '../community/community.entity.js';
import { PlatformModule } from '../platform/platform.module.js';
import { SocialModule } from '../social/social.module.js';
import { EngagementController } from './engagement.controller.js';
import {
  Bookmark,
  Comment,
  ContentViewRecord,
  Like,
  ReadingProgress,
  Report,
} from './engagement.entity.js';
import { EngagementService } from './engagement.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Like,
      Comment,
      Bookmark,
      ContentViewRecord,
      ReadingProgress,
      Report,
      Content,
      Challenge,
      ChallengeCredit,
      ChallengeProgress,
    ]),
    ContentModule,
    ActivityModule,
    PlatformModule,
    SocialModule,
  ],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
