import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformService } from '../platform/platform.service.js';
import { User } from '../users/user.entity.js';
import { DeviceToken, Follow, Notification } from './social.entity.js';

export type NoticeType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'new_content'
  | 'system';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(Follow)
    private readonly follows: Repository<Follow>,
    @InjectRepository(DeviceToken)
    private readonly devices: Repository<DeviceToken>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly platform: PlatformService,
  ) {}

  async notify(input: {
    userId: string;
    message: string;
    type: NoticeType;
    contentId?: string | null;
    actorId?: string | null;
    actorName?: string | null;
  }): Promise<void> {
    if (input.actorId && input.actorId === input.userId) {
      return;
    }
    const saved = await this.notifications.save(
      this.notifications.create({
        userId: input.userId,
        read: false,
        message: input.message,
        type: input.type,
        contentId: input.contentId ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
      }),
    );
    await this.push(saved);
  }

  async notifyFollowers(
    authorId: string,
    contentId: string,
    title: string,
    actorName: string,
  ): Promise<void> {
    const edges = await this.follows.find({ where: { followingId: authorId } });
    for (const edge of edges) {
      await this.notify({
        userId: edge.followerId,
        type: 'new_content',
        message: `${actorName} published “${title}”.`,
        contentId,
        actorId: authorId,
        actorName,
      });
    }
  }

  list(userId: string) {
    return this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.notifications.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.notifications.update({ id, userId }, { read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.update({ userId, read: false }, { read: true });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.notifications.delete({ id, userId });
  }

  async saveDevice(userId: string, token: string): Promise<void> {
    const existing = await this.devices.findOne({ where: { token } });
    if (existing) {
      existing.userId = userId;
      await this.devices.save(existing);
      return;
    }
    await this.devices.save(this.devices.create({ userId, token }));
  }

  private async push(notice: Notification): Promise<void> {
    const user = await this.users.findOne({ where: { id: notice.userId } });
    const master = await this.platform.pushMasterEnabled();
    if (!user?.pushEnabled || !master) {
      return;
    }
    const tokens = await this.devices.find({ where: { userId: user.id } });
    if (tokens.length === 0) {
      return;
    }
    const key = process.env.FCM_SERVER_KEY;
    if (!key) {
      this.logger.log('Push skipped; FCM is not configured');
      return;
    }
    const body = notice.message.slice(0, 200);
    await Promise.all(
      tokens.map((device) =>
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            authorization: `key=${key}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            to: device.token,
            notification: { title: 'PoetMatrix', body },
            data: { link: '/notifications' },
          }),
        }).catch(() => undefined),
      ),
    );
  }
}
