import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { Content } from '../content/content.entity.js';
import { PlatformModule } from '../platform/platform.module.js';
import { User } from '../users/user.entity.js';
import { FollowService } from './follow.service.js';
import { NotificationService } from './notification.service.js';
import { SocialController } from './social.controller.js';
import { DeviceToken, Follow, Notification } from './social.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeviceToken, Follow, User, Content]),
    PlatformModule,
    ActivityModule,
  ],
  controllers: [SocialController],
  providers: [NotificationService, FollowService],
  exports: [NotificationService, TypeOrmModule],
})
export class SocialModule {}
