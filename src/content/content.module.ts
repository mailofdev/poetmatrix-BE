import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './content.entity.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Content])],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
