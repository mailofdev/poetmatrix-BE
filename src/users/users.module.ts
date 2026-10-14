import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityModule } from '../activity/activity.module.js';
import { Content } from '../content/content.entity.js';
import { AccountService } from './account.service.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content]), ActivityModule],
  controllers: [UsersController],
  providers: [UsersService, AccountService],
  exports: [UsersService, AccountService],
})
export class UsersModule {}
