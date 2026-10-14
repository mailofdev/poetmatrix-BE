import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlockedKeyword,
  LandingCache,
  SiteConfig,
} from './platform.entity.js';
import { PlatformService } from './platform.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig, BlockedKeyword, LandingCache])],
  providers: [PlatformService],
  exports: [PlatformService, TypeOrmModule],
})
export class PlatformModule {}
