import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { FollowService } from './follow.service.js';
import { NotificationService } from './notification.service.js';

class PushTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  token: string;
}

@ApiTags('social')
@ApiBearerAuth()
@Controller()
export class SocialController {
  constructor(
    private readonly follows: FollowService,
    private readonly notifications: NotificationService,
  ) {}

  @Post('users/:id/follow')
  follow(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.follows.follow(user.id, id, user.email);
  }

  @Delete('users/:id/follow')
  unfollow(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.follows.unfollow(user.id, id);
  }

  @Get('following')
  following(@CurrentUser() user: AuthUser) {
    return this.follows.following(user.id);
  }

  @Get('feed')
  feed(@CurrentUser() user: AuthUser) {
    return this.follows.feed(user.id);
  }

  @Get('notifications')
  inbox(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id);
  }

  @Get('notifications/unread-count')
  unread(@CurrentUser() user: AuthUser) {
    return this.notifications.unreadCount(user.id).then((count) => ({ count }));
  }

  @Post('notifications/read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post('notifications/:id/read')
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Delete('notifications/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.remove(user.id, id);
  }

  @Post('users/me/push-token')
  token(@CurrentUser() user: AuthUser, @Body() dto: PushTokenDto) {
    return this.notifications.saveDevice(user.id, dto.token);
  }
}
