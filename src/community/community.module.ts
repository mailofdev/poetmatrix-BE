import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import {
  Challenge,
  ChallengeProgress,
  Enquiry,
  Prompt,
} from './community.entity.js';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prompt, Challenge, ChallengeProgress, Enquiry]),
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
