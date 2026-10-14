import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { DataSource, Repository } from 'typeorm';
import { Content, PublishUsage, SearchIndex } from '../content/content.entity.js';
import { Enquiry } from '../community/community.entity.js';
import { Report } from '../engagement/engagement.entity.js';
import { Follow } from '../social/social.entity.js';
import { User } from './user.entity.js';

@Injectable()
export class AccountService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Content) private readonly contents: Repository<Content>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }
    const pieces = await this.contents.find({ where: { authorId: userId } });
    await this.removeUpload(user.photoPath);
    for (const piece of pieces) {
      await this.removeUpload(piece.coverPath);
    }
    await this.dataSource.transaction(async (manager) => {
      const contentIds = pieces.map((piece) => piece.id);
      if (contentIds.length > 0) {
        await manager
          .getRepository(SearchIndex)
          .createQueryBuilder()
          .delete()
          .where('content_id IN (:...contentIds)', { contentIds })
          .execute();
        await manager
          .getRepository(PublishUsage)
          .createQueryBuilder()
          .delete()
          .where('content_id IN (:...contentIds)', { contentIds })
          .execute();
        await manager.getRepository(Content).delete(contentIds);
      }
      await manager
        .getRepository(Follow)
        .createQueryBuilder()
        .delete()
        .where('follower_id = :userId OR following_id = :userId', { userId })
        .execute();
      await manager.getRepository(Report).delete({ reporterId: userId });
      await manager.getRepository(Enquiry).delete({ userId });
      await manager.getRepository(User).delete({ id: userId });
    });
  }

  private async removeUpload(publicPath: string | null): Promise<void> {
    if (!publicPath?.startsWith('/uploads/')) {
      return;
    }
    try {
      await unlink(publicPath.slice(1));
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
