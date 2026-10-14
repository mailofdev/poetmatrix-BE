import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { PlatformService } from '../platform/platform.service.js';
import { EngagementService } from './engagement.service.js';

class CommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body: string;
}

class ProgressDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  percent: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  scroll: number;
}

class ReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}

@ApiTags('engagement')
@ApiBearerAuth()
@Controller()
export class EngagementController {
  constructor(
    private readonly engagement: EngagementService,
    private readonly platform: PlatformService,
  ) {}

  @Post('content/:id/like')
  like(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.engagement.like(user, id);
  }

  @Delete('content/:id/like')
  unlike(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.engagement.unlike(user, id);
  }

  @Public()
  @Get('content/:id/comments')
  async comments(@Param('id', ParseUUIDPipe) id: string) {
    if (!(await this.platform.commentsEnabled())) {
      return [];
    }
    return this.engagement.listComments(id);
  }

  @Post('content/:id/comments')
  comment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommentDto,
  ) {
    return this.engagement.comment(user, id, dto.body);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  deleteComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagement.deleteComment(user, id);
  }

  @Post('content/:id/bookmark')
  bookmark(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagement.bookmark(user, id);
  }

  @Delete('content/:id/bookmark')
  unbookmark(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagement.unbookmark(user, id);
  }

  @Get('library')
  library(@CurrentUser() user: AuthUser) {
    return this.engagement.library(user);
  }

  @Post('content/:id/view')
  view(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.engagement.view(user, id);
  }

  @Post('content/:id/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProgressDto,
  ) {
    return this.engagement.saveProgress(user, id, dto.percent, dto.scroll);
  }

  @Get('content/:id/progress')
  progressFor(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.engagement.progressFor(user, id);
  }

  @Get('reading/continue')
  continueReading(@CurrentUser() user: AuthUser) {
    return this.engagement.continueReading(user);
  }

  @Post('content/:id/report')
  report(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportDto,
  ) {
    return this.engagement.report(user, id, dto.reason);
  }
}
