import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity.entity.js';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logs: Repository<ActivityLog>,
  ) {}

  record(
    actorId: string | null,
    action: string,
    subjectType: string,
    subjectId?: string | null,
  ): Promise<ActivityLog> {
    return this.logs.save(
      this.logs.create({
        actorId,
        action,
        subjectType,
        subjectId: subjectId ?? null,
      }),
    );
  }

  list(page: number, limit: number) {
    return this.logs.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
