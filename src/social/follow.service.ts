import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service.js';
import { Content } from '../content/content.entity.js';
import { previewText, sanitizeHtml } from '../content/content-rules.js';
import { NotificationService } from './notification.service.js';
import { Follow } from './social.entity.js';
import { User } from '../users/user.entity.js';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Content) private readonly contents: Repository<Content>,
    private readonly notifications: NotificationService,
    private readonly activity: ActivityService,
  ) {}

  async follow(actorId: string, targetId: string, actorName: string) {
    if (actorId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const target = await this.users.findOne({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException('Writer not found');
    }
    const existing = await this.follows.findOne({
      where: { followerId: actorId, followingId: targetId },
    });
    if (!existing) {
      await this.follows.save(
        this.follows.create({ followerId: actorId, followingId: targetId }),
      );
      await this.users.increment({ id: actorId }, 'followingCount', 1);
      await this.users.increment({ id: targetId }, 'followerCount', 1);
      await this.notifications.notify({
        userId: targetId,
        type: 'follow',
        message: `${actorName} followed you.`,
        actorId,
        actorName,
      });
      await this.activity.record(actorId, 'follow', 'user', targetId);
    }
    return { following: true };
  }

  async unfollow(actorId: string, targetId: string) {
    const existing = await this.follows.findOne({
      where: { followerId: actorId, followingId: targetId },
    });
    if (existing) {
      await this.follows.delete({ followerId: actorId, followingId: targetId });
      await this.users.decrement({ id: actorId }, 'followingCount', 1);
      await this.users.decrement({ id: targetId }, 'followerCount', 1);
    }
    return { following: false };
  }

  async following(actorId: string) {
    const edges = await this.follows.find({ where: { followerId: actorId } });
    const people = [];
    for (const edge of edges) {
      const user = await this.users.findOne({ where: { id: edge.followingId } });
      if (user) {
        people.push({
          id: user.id,
          displayName: user.displayName,
          penName: user.penName,
          photo: user.photoPath,
          writer: user.writerSubscription,
        });
      }
    }
    return people;
  }

  async feed(actorId: string) {
    const edges = await this.follows.find({ where: { followerId: actorId } });
    if (edges.length === 0) {
      return [];
    }
    const rows = await this.contents
      .createQueryBuilder('content')
      .where('content.authorId IN (:...ids)', {
        ids: edges.map((edge) => edge.followingId),
      })
      .andWhere('content.saveAs = :status AND content.visibility = :visibility', {
        status: 'published',
        visibility: 'public',
      })
      .orderBy('content.createdAt', 'DESC')
      .take(30)
      .getMany();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      preview: row.preview || previewText(row.writings),
      genre: row.genre,
      authorId: row.authorId,
      authorName: row.authorName,
      cover: row.coverPath,
      readingMinutes: row.readingMinutes,
      body: sanitizeHtml(row.writings),
      createdAt: row.createdAt,
    }));
  }
}
