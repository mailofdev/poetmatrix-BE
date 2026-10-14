import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
import { Content } from './content.entity.js';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  create(@Body() dto: CreateContentDto): Promise<Content> {
    return this.contentService.create(dto);
  }

  @Get()
  findAll(): Promise<Content[]> {
    return this.contentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Content> {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<Content> {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contentService.remove(id);
  }
}
