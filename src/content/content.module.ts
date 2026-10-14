import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Content } from './content.entity.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content]), AuthModule],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
