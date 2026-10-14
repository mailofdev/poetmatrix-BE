var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { canMutateContent, canReadContent, } from '../common/authorization/content-access.js';
import { ActivityService } from '../activity/activity.service.js';
import { NotificationService } from '../social/notification.service.js';
import { PlatformService } from '../platform/platform.service.js';
import { resolveActor } from '../users/account-rules.js';
import { UsersService } from '../users/users.service.js';
import { Content, PublishUsage, SearchIndex } from './content.entity.js';
import { containsBlockedKeyword, decidePublish, previewText, readingMinutes, sanitizeHtml, } from './content-rules.js';
let ContentService = class ContentService {
    contents;
    usage;
    search;
    users;
    notifications;
    activity;
    platform;
    constructor(contents, usage, search, users, notifications, activity, platform) {
        this.contents = contents;
        this.usage = usage;
        this.search = search;
        this.users = users;
        this.notifications = notifications;
        this.activity = activity;
        this.platform = platform;
    }
    async create(dto, actor) {
        const saved = await this.persist(null, dto, actor);
        await this.activity.record(actor.id, 'content_create', 'content', saved.id);
        return saved;
    }
    async update(id, dto, actor) {
        const existing = await this.requireMutable(id, actor);
        const saved = await this.persist(existing, dto, actor);
        await this.activity.record(actor.id, 'content_update', 'content', saved.id);
        return saved;
    }
    async remove(id, actor) {
        const existing = await this.requireMutable(id, actor);
        const monthKey = this.monthKey();
        await this.usage.delete({ contentId: existing.id, monthKey });
        await this.search.delete({ contentId: existing.id });
        await this.contents.delete({ id: existing.id });
        await this.activity.record(actor.id, 'content_delete', 'content', id);
    }
    async catalog(limit, cursor, genre) {
        const take = Math.min(Math.max(limit, 1), 50);
        const qb = this.contents
            .createQueryBuilder('content')
            .where('content.saveAs = :status AND content.visibility = :visibility', {
            status: 'published',
            visibility: 'public',
        });
        const decoded = cursor ? this.decodeCursor(cursor) : null;
        if (decoded) {
            qb.andWhere('(content.createdAt < :at OR (content.createdAt = :at AND content.id < :id))', { at: decoded.at, id: decoded.id });
        }
        if (genre) {
            qb.andWhere('content.genre = :genre', { genre });
        }
        const rows = await qb
            .orderBy('content.createdAt', 'DESC')
            .addOrderBy('content.id', 'DESC')
            .take(take + 1)
            .getMany();
        const page = rows.slice(0, take);
        const last = page.at(-1);
        return {
            data: page.map((row) => this.present(row)),
            nextCursor: rows.length > take && last ? this.encodeCursor(last) : null,
        };
    }
    async mine(actor) {
        const rows = await this.contents.find({
            where: { authorId: actor.id },
            order: { updatedAt: 'DESC' },
        });
        return rows.map((row) => this.present(row));
    }
    async findOne(id, actor) {
        const content = await this.contents.findOne({ where: { id } });
        if (!content || !canReadContent(content, actor)) {
            throw new NotFoundException('Content not found');
        }
        return this.present(content);
    }
    async setCover(id, actor, coverPath) {
        const content = await this.requireMutable(id, actor);
        content.coverPath = coverPath;
        return this.present(await this.contents.save(content));
    }
    async usageFor(userId) {
        const user = await this.users.findById(userId);
        const plan = user?.plan ?? 'free';
        const used = await this.usage.count({
            where: { userId, monthKey: this.monthKey() },
        });
        const cap = plan === 'pro' ? null : plan === 'basic' ? 50 : 5;
        return { plan, used, cap, month: this.monthKey() };
    }
    async persist(existing, dto, actor) {
        if (dto.status === 'published' && !dto.genre) {
            throw new BadRequestException('Genre is required to publish');
        }
        const authorId = existing?.authorId ?? actor.id;
        const author = await this.users.findById(authorId);
        const keywords = await this.platform.keywordList();
        const body = sanitizeHtml(dto.body);
        const blocked = containsBlockedKeyword(`${dto.title} ${body}`, keywords);
        const monthKey = this.monthKey();
        const already = existing
            ? await this.usage.findOne({
                where: { contentId: existing.id, monthKey },
            })
            : null;
        const publishedThisMonth = authorId
            ? await this.usage.count({ where: { userId: authorId, monthKey } })
            : 0;
        const decision = decidePublish({
            requestedStatus: dto.status,
            requestedVisibility: dto.visibility ?? 'public',
            plan: author?.plan ?? actor.plan,
            publishedThisMonth: already
                ? Math.max(0, publishedThisMonth - 1)
                : publishedThisMonth,
            isSuperadmin: resolveActor(actor) === 'superadmin',
            blocked,
            genre: dto.genre,
        });
        const piece = existing ?? this.contents.create();
        const wasPublic = existing?.saveAs === 'published' && existing.visibility === 'public';
        piece.title = dto.title.trim();
        piece.subtitle = dto.subtitle?.trim() ?? '';
        piece.writings = body;
        piece.type = dto.type ?? 'story';
        piece.articleSubtype = dto.articleSubtype ?? null;
        piece.tags = dto.tags ?? '';
        piece.language = dto.language ?? 'en';
        piece.saveAs = decision.status;
        piece.visibility = decision.visibility;
        piece.commentsAllowed = dto.commentsAllowed ?? true;
        piece.genre = dto.genre ?? existing?.genre ?? '';
        piece.seriesTitle = dto.seriesTitle ?? null;
        piece.seriesChapter = dto.seriesChapter ?? null;
        piece.authorId = authorId;
        piece.authorName = author?.penName || author?.displayName || 'Writer';
        piece.preview = previewText(body);
        piece.readingMinutes = readingMinutes(body);
        piece.limitReason = decision.limitReached
            ? 'monthly_publish_limit'
            : decision.blocked
                ? 'blocked_keyword'
                : null;
        const saved = await this.contents.save(piece);
        if (!decision.limitReached && decision.status !== 'published' && existing) {
            await this.usage.delete({ contentId: saved.id, monthKey });
        }
        if (decision.countPublish && !already) {
            await this.usage.save(this.usage.create({
                userId: authorId,
                contentId: saved.id,
                monthKey,
            }));
        }
        const isPublic = saved.saveAs === 'published' && saved.visibility === 'public';
        if (isPublic) {
            await this.search.save(this.search.create({
                contentId: saved.id,
                title: saved.title,
                genre: saved.genre,
                authorId: saved.authorId,
                authorName: saved.authorName,
            }));
            if (!wasPublic && saved.authorId) {
                await this.notifications.notifyFollowers(saved.authorId, saved.id, saved.title, saved.authorName);
            }
        }
        else {
            await this.search.delete({ contentId: saved.id });
        }
        if (decision.limitReached && saved.authorId) {
            await this.notifications.notify({
                userId: saved.authorId,
                type: 'system',
                message: 'This month’s publish limit was reached. The piece was saved as a draft.',
                contentId: saved.id,
            });
        }
        return this.present(saved);
    }
    async requireMutable(id, actor) {
        const content = await this.contents.findOne({ where: { id } });
        if (!content || !canMutateContent(content, actor)) {
            throw new NotFoundException('Content not found');
        }
        return content;
    }
    present(content) {
        return {
            id: content.id,
            title: content.title,
            subtitle: content.subtitle,
            body: sanitizeHtml(content.writings),
            type: content.type,
            articleSubtype: content.articleSubtype,
            tags: content.tags ? content.tags.split(',').filter(Boolean) : [],
            cover: content.coverPath,
            language: content.language,
            status: content.saveAs,
            visibility: content.visibility,
            commentsAllowed: content.commentsAllowed,
            featured: content.featured,
            boosted: content.boosted,
            genre: content.genre,
            seriesTitle: content.seriesTitle,
            seriesChapter: content.seriesChapter,
            authorId: content.authorId,
            authorName: content.authorName,
            preview: content.preview || previewText(content.writings),
            readingMinutes: content.readingMinutes,
            viewCount: content.viewCount,
            limitReason: content.limitReason,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt,
        };
    }
    monthKey() {
        return new Date().toISOString().slice(0, 7);
    }
    encodeCursor(content) {
        return Buffer.from(`${content.createdAt.toISOString()}|${content.id}`).toString('base64url');
    }
    decodeCursor(cursor) {
        const raw = Buffer.from(cursor, 'base64url').toString('utf8');
        const [iso, id] = raw.split('|');
        if (!iso || !id) {
            return null;
        }
        const at = new Date(iso);
        return Number.isNaN(at.getTime()) ? null : { at, id };
    }
};
ContentService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Content)),
    __param(1, InjectRepository(PublishUsage)),
    __param(2, InjectRepository(SearchIndex)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        UsersService,
        NotificationService,
        ActivityService,
        PlatformService])
], ContentService);
export { ContentService };
//# sourceMappingURL=content.service.js.map