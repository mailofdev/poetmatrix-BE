import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../content/content.entity.js';
import { SearchIndex } from '../content/content.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { ContentModule } from '../content/content.module.js';
import { LandingCache } from '../platform/platform.entity.js';
import { PlatformModule } from '../platform/platform.module.js';
import { User } from '../users/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { DiscoveryController } from './discovery.controller.js';
import { DiscoveryService } from './discovery.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, SearchIndex, User, LandingCache]),
    AuthModule,
    ContentModule,
    PlatformModule,
    UsersModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
