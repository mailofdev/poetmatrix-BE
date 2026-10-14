import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canMutateContent,
  canReadContent,
} from '../common/authorization/content-access.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { Role } from '../users/role.js';
import { Content } from './content.entity.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';

export type ContentPage = {
  data: Content[];
  meta: { page: number; limit: number; total: number };
};

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  create(dto: CreateContentDto, user: AuthUser): Promise<Content> {
    if (user.role !== Role.Writer && user.role !== Role.SuperAdmin) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    const content = this.contentRepository.create({
      title: dto.title,
      genre: dto.genre,
      saveAs: dto.saveAs,
      writings: dto.writings,
      authorId: user.id,
    });
    return this.contentRepository.save(content);
  }

  async findAll(
    user: AuthUser | null,
    page: number,
    limit: number,
  ): Promise<ContentPage> {
    const qb = this.contentRepository.createQueryBuilder('content');
    if (!user) {
      qb.where('content.saveAs = :published', { published: 'published' });
    } else if (user.role !== Role.SuperAdmin) {
      qb.where(
        '(content.saveAs = :published OR content.authorId = :authorId)',
        { published: 'published', authorId: user.id },
      );
    }
    qb.orderBy('content.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async findOne(id: string, user: AuthUser | null): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content || !canReadContent(content, user)) {
      throw new NotFoundException('Content not found');
    }
    return content;
  }

  async update(
    id: string,
    dto: UpdateContentDto,
    user: AuthUser,
  ): Promise<Content> {
    if (
      dto.title === undefined &&
      dto.genre === undefined &&
      dto.saveAs === undefined &&
      dto.writings === undefined
    ) {
      throw new BadRequestException('At least one field is required');
    }
    const content = await this.requireMutable(id, user);
    Object.assign(content, dto);
    return this.contentRepository.save(content);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const content = await this.requireMutable(id, user);
    await this.contentRepository.remove(content);
  }

  private async requireMutable(id: string, user: AuthUser): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content || !canMutateContent(content, user)) {
      throw new NotFoundException('Content not found');
    }
    return content;
  }
}
