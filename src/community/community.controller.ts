import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service.js';

class ContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(320)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message: string;
}

@ApiTags('community')
@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Public()
  @Get('prompts')
  prompts() {
    return this.community.promptsForWriters();
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('challenges')
  challenges(@CurrentUser() user?: AuthUser) {
    return this.community.challengesFor(user?.id ?? null);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('contact')
  contact(
    @Body() dto: ContactDto,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: Request,
  ) {
    return this.community.contact({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      userId: user?.id ?? null,
      ip: request.ip ?? null,
    });
  }
}
