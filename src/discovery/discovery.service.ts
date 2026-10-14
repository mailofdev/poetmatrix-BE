import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, SearchIndex } from '../content/content.entity.js';
import { ContentService } from '../content/content.service.js';
import { LandingCache } from '../platform/platform.entity.js';
import { PlatformService } from '../platform/platform.service.js';
import { User } from '../users/user.entity.js';
import { toPublicProfile } from '../users/account-rules.js';
import { GENRES } from '../content/content-rules.js';

@Injectable()
export class DiscoveryService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Content) private readonly contents: Repository<Content>,
    @InjectRepository(SearchIndex)
    private readonly searchIndex: Repository<SearchIndex>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(LandingCache)
    private readonly cache: Repository<LandingCache>,
    private readonly contentService: ContentService,
    private readonly platform: PlatformService,
  ) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    this.timer = setInterval(() => {
      void this.refreshLanding();
    }, 15 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async home() {
    const cached = await this.cache.findOne({ where: { id: 1 } });
    if (cached && Date.now() - cached.refreshedAt.getTime() < 15 * 60 * 1000) {
      return cached.payload;
    }
    return this.refreshLanding();
  }

  async refreshLanding() {
    const config = await this.platform.publicConfig();
    const latest = await this.contents.find({
      where: { saveAs: 'published', visibility: 'public' },
      order: { createdAt: 'DESC' },
      take: 8,
    });
    const writers = await this.directory();
    const payload = {
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      seoTitle: config.seoTitle,
      seoDescription: config.seoDescription,
      genres: GENRES,
      pieces: latest.map((row) => this.contentService.present(row)),
      writers: writers.slice(0, 8),
    };
    await this.cache.save(
      this.cache.create({ id: 1, payload, refreshedAt: new Date() }),
    );
    return payload;
  }

  async search(query: string, genre?: string, writerId?: string) {
    const q = query.trim();
    if (q.length < 2) {
      throw new BadRequestException('Search needs at least 2 characters');
    }
    const qb = this.searchIndex
      .createQueryBuilder('entry')
      .where('entry.title ILIKE :q', { q: `%${q}%` });
    if (genre) {
      qb.andWhere('entry.genre = :genre', { genre });
    }
    if (writerId) {
      qb.andWhere('entry.authorId = :writerId', { writerId });
    }
    const rows = await qb.take(50).getMany();
    const pieces = [];
    for (const row of rows) {
      const piece = await this.contents.findOne({ where: { id: row.contentId } });
      if (piece?.saveAs === 'published' && piece.visibility === 'public') {
        pieces.push(this.contentService.present(piece));
      }
    }
    return pieces;
  }

  trending() {
    return this.contents
      .find({
        where: { saveAs: 'published', visibility: 'public' },
        order: { viewCount: 'DESC', createdAt: 'DESC' },
        take: 20,
      })
      .then((rows) => rows.map((row) => this.contentService.present(row)));
  }

  async directory() {
    const writers = await this.users.find({
      where: { writerSubscription: true },
      take: 50,
    });
    return writers.map((user) => toPublicProfile(user));
  }

  async recommendations(interests: string[]) {
    if (interests.length === 0) {
      return this.trending();
    }
    const rows = await this.contents
      .createQueryBuilder('content')
      .where('content.saveAs = :status AND content.visibility = :visibility', {
        status: 'published',
        visibility: 'public',
      })
      .andWhere('content.genre IN (:...genres)', { genres: interests })
      .orderBy('content.createdAt', 'DESC')
      .take(12)
      .getMany();
    return rows.map((row) => this.contentService.present(row));
  }
}
