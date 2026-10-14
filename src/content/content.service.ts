import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './content.entity.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  create(dto: CreateContentDto): Promise<Content> {
    const content = this.contentRepository.create(dto);
    return this.contentRepository.save(content);
  }

  findAll(): Promise<Content[]> {
    return this.contentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException(`Content ${id} not found`);
    }
    return content;
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);
    Object.assign(content, dto);
    return this.contentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentRepository.remove(content);
  }
}
