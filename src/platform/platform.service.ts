import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedKeyword, SiteConfig } from './platform.entity.js';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(SiteConfig)
    private readonly config: Repository<SiteConfig>,
    @InjectRepository(BlockedKeyword)
    private readonly keywords: Repository<BlockedKeyword>,
  ) {}

  async getConfig(): Promise<SiteConfig> {
    const row = await this.config.findOne({ where: { id: 1 } });
    if (row) {
      return row;
    }
    return this.config.save(this.config.create({ id: 1 }));
  }

  async publicConfig() {
    const row = await this.getConfig();
    return {
      heroTitle: row.heroTitle,
      heroSubtitle: row.heroSubtitle,
      aboutTeaser: row.aboutTeaser,
      policiesNote: row.policiesNote,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      commentsGloballyEnabled: row.commentsGloballyEnabled,
    };
  }

  async keywordList(): Promise<string[]> {
    const rows = await this.keywords.find();
    return rows.map((row) => row.word);
  }

  async commentsEnabled(): Promise<boolean> {
    return (await this.getConfig()).commentsGloballyEnabled;
  }

  async pushMasterEnabled(): Promise<boolean> {
    return (await this.getConfig()).pushMasterEnabled;
  }
}
