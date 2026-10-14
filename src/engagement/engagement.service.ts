import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityService } from '../activity/activity.service.js';
import { Content } from '../content/content.entity.js';
import { ContentService } from '../content/content.service.js';
import { canReadContent } from '../common/authorization/content-access.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { PlatformService } from '../platform/platform.service.js';
import { NotificationService } from '../social/notification.service.js';
import {
  Challenge,
  ChallengeCredit,
  ChallengeProgress,
} from '../community/community.entity.js';
import {
  Bookmark,
  Comment,
  ContentViewRecord,
  Like,
  ReadingProgress,
  Report,
} from './engagement.entity.js';
import {
  canComment,
  canDeleteComment,
  challengeCredit,
  progressAccepted,
  reportReasonAccepted,
  shouldCountView,
} from './engagement-rules.js';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Bookmark)
    private readonly bookmarks: Repository<Bookmark>,
    @InjectRepository(ContentViewRecord)
    private readonly views: Repository<ContentViewRecord>,
    @InjectRepository(ReadingProgress)
    private readonly progress: Repository<ReadingProgress>,
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(Content) private readonly contents: Repository<Content>,
    @InjectRepository(Challenge)
    private readonly challenges: Repository<Challenge>,
    @InjectRepository(ChallengeProgress)
    private readonly challengeProgress: Repository<ChallengeProgress>,
    @InjectRepository(ChallengeCredit)
    private readonly credits: Repository<ChallengeCredit>,
    private readonly contentService: ContentService,
    private readonly notifications: NotificationService,
    private readonly activity: ActivityService,
    private readonly platform: PlatformService,
  ) {}

  async like(actor: AuthUser, contentId: string) {
    const piece = await this.requireReadable(contentId, actor);
    const existing = await this.likes.findOne({
      where: { userId: actor.id, contentId },
    });
    if (!existing) {
      await this.likes.save(this.likes.create({ userId: actor.id, contentId }));
      await this.activity.record(actor.id, 'like', 'content', contentId);
      if (piece.authorId) {
        await this.notifications.notify({
          userId: piece.authorId,
          type: 'like',
          message: 'Someone liked your piece.',
          contentId,
          actorId: actor.id,
          actorName: actor.email,
        });
      }
    }
    return { liked: true };
  }

  async unlike(actor: AuthUser, contentId: string) {
    await this.likes.delete({ userId: actor.id, contentId });
    return { liked: false };
  }

  async comment(actor: AuthUser, contentId: string, body: string) {
    const piece = await this.requireReadable(contentId, actor);
    const globallyEnabled = await this.platform.commentsEnabled();
    if (
      !canComment({
        signedIn: true,
        pieceAllows: piece.commentsAllowed,
        globallyEnabled,
      })
    ) {
      throw new ForbiddenException('Comments are closed');
    }
    const text = body.trim();
    if (text.length < 1 || text.length > 4000) {
      throw new BadRequestException('Comment length is invalid');
    }
    const saved = await this.comments.save(
      this.comments.create({
        contentId,
        authorId: actor.id,
        body: text,
      }),
    );
    await this.activity.record(actor.id, 'comment', 'comment', saved.id);
    if (piece.authorId) {
      await this.notifications.notify({
        userId: piece.authorId,
        type: 'comment',
        message: 'Someone commented on your piece.',
        contentId,
        actorId: actor.id,
        actorName: actor.email,
      });
    }
    return saved;
  }

  async deleteComment(actor: AuthUser, commentId: string) {
    const comment = await this.comments.findOne({ where: { id: commentId } });
    if (!comment || !canDeleteComment(comment.authorId, actor.id)) {
      throw new NotFoundException('Comment not found');
    }
    await this.comments.delete({ id: commentId });
  }

  async listComments(contentId: string) {
    const piece = await this.contents.findOne({ where: { id: contentId } });
    const globallyEnabled = await this.platform.commentsEnabled();
    if (!piece?.commentsAllowed || !globallyEnabled) {
      return [];
    }
    if (piece.saveAs !== 'published' || piece.visibility !== 'public') {
      return [];
    }
    return this.comments.find({
      where: { contentId },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async bookmark(actor: AuthUser, contentId: string) {
    await this.requireReadable(contentId, actor);
    const existing = await this.bookmarks.findOne({
      where: { userId: actor.id, contentId },
    });
    if (!existing) {
      await this.bookmarks.save(
        this.bookmarks.create({ userId: actor.id, contentId }),
      );
      await this.activity.record(actor.id, 'bookmark', 'content', contentId);
    }
    return { bookmarked: true };
  }

  async unbookmark(actor: AuthUser, contentId: string) {
    await this.bookmarks.delete({ userId: actor.id, contentId });
    return { bookmarked: false };
  }

  async library(actor: AuthUser) {
    const marks = await this.bookmarks.find({
      where: { userId: actor.id },
      order: { createdAt: 'DESC' },
    });
    const pieces = [];
    for (const mark of marks) {
      const piece = await this.contents.findOne({
        where: { id: mark.contentId },
      });
      if (piece && canReadContent(piece, actor)) {
        pieces.push(this.contentService.present(piece));
      }
    }
    return pieces;
  }

  async view(actor: AuthUser, contentId: string) {
    await this.requireReadable(contentId, actor);
    const existing = await this.views.findOne({
      where: { userId: actor.id, contentId },
    });
    if (
      shouldCountView({ signedIn: true, alreadyViewed: Boolean(existing) })
    ) {
      await this.views.save(
        this.views.create({ userId: actor.id, contentId }),
      );
      await this.contents.increment({ id: contentId }, 'viewCount', 1);
    }
    return { counted: !existing };
  }

  async saveProgress(
    actor: AuthUser,
    contentId: string,
    percent: number,
    scroll: number,
  ) {
    await this.requireReadable(contentId, actor);
    if (!progressAccepted(percent)) {
      throw new BadRequestException('Progress must be between 0 and 100');
    }
    const row =
      (await this.progress.findOne({
        where: { userId: actor.id, contentId },
      })) ??
      this.progress.create({ userId: actor.id, contentId, percent, scroll });
    row.percent = percent;
    row.scroll = Math.max(0, Math.floor(scroll));
    await this.progress.save(row);
    await this.creditChallenges(actor.id, contentId, percent);
    return row;
  }

  progressFor(actor: AuthUser, contentId: string) {
    return this.progress.findOne({
      where: { userId: actor.id, contentId },
    });
  }

  continueReading(actor: AuthUser) {
    return this.progress.find({
      where: { userId: actor.id },
      order: { updatedAt: 'DESC' },
      take: 8,
    });
  }

  async report(actor: AuthUser, contentId: string, reason: string) {
    await this.requireReadable(contentId, actor);
    if (!reportReasonAccepted(reason)) {
      throw new BadRequestException('Reason must be 3–2000 characters');
    }
    return this.reports.save(
      this.reports.create({
        contentId,
        reporterId: actor.id,
        reason: reason.trim(),
        status: 'pending',
      }),
    );
  }

  private async creditChallenges(
    userId: string,
    contentId: string,
    percent: number,
  ) {
    const already = await this.credits.findOne({
      where: { userId, contentId },
    });
    if (!challengeCredit(percent, Boolean(already))) {
      return;
    }
    const month = new Date().toISOString().slice(0, 7);
    const active = await this.challenges.find({
      where: { active: true, month },
    });
    if (active.length === 0) {
      return;
    }
    await this.credits.save(this.credits.create({ userId, contentId }));
    for (const challenge of active) {
      const row =
        (await this.challengeProgress.findOne({
          where: { userId, challengeId: challenge.id },
        })) ??
        this.challengeProgress.create({
          userId,
          challengeId: challenge.id,
          progress: 0,
        });
      row.progress += 1;
      await this.challengeProgress.save(row);
    }
  }

  private async requireReadable(contentId: string, actor: AuthUser) {
    const piece = await this.contents.findOne({ where: { id: contentId } });
    if (!piece || !canReadContent(piece, actor)) {
      throw new NotFoundException('Content not found');
    }
    return piece;
  }
}
