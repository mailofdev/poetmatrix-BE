import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Challenge, ChallengeProgress, Enquiry, Prompt } from './community.entity.js';

const STARTERS = [
  { title: 'A door that opens only at dusk', body: 'Write the first scene on the other side.' },
  { title: 'The letter that arrived late', body: 'Someone receives news that changes a quiet week.' },
  { title: 'Rain on a tin roof', body: 'Stay with one room and the sound of the weather.' },
];

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Prompt) private readonly prompts: Repository<Prompt>,
    @InjectRepository(Challenge)
    private readonly challenges: Repository<Challenge>,
    @InjectRepository(ChallengeProgress)
    private readonly progress: Repository<ChallengeProgress>,
    @InjectRepository(Enquiry) private readonly enquiries: Repository<Enquiry>,
  ) {}

  async promptsForWriters() {
    const stored = await this.prompts.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 3,
    });
    if (stored.length === 0) {
      return STARTERS;
    }
    return stored.map((prompt) => ({
      title: prompt.title,
      body: prompt.body,
    }));
  }

  async challengesFor(userId: string | null) {
    const month = new Date().toISOString().slice(0, 7);
    const rows = await this.challenges.find({
      where: { active: true, month },
    });
    const present = (row: Challenge, progress: number) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      target: row.target,
      type: row.type,
      active: row.active,
      month: row.month,
      progress,
    });
    if (!userId) {
      return rows.map((row) => present(row, 0));
    }
    const result = [];
    for (const row of rows) {
      const progress = await this.progress.findOne({
        where: { userId, challengeId: row.id },
      });
      result.push(present(row, progress?.progress ?? 0));
    }
    return result;
  }

  async contact(input: {
    name: string;
    email: string;
    subject: string;
    message: string;
    userId: string | null;
    ip: string | null;
  }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new BadRequestException('Enter a valid email');
    }
    if (
      input.name.trim().length < 2 ||
      input.subject.trim().length < 2 ||
      input.message.trim().length < 10 ||
      input.message.length > 4000
    ) {
      throw new BadRequestException('Check the length of your message');
    }
    const since = new Date(Date.now() - (input.userId ? 60_000 : 120_000));
    const recent = input.userId
      ? await this.enquiries.findOne({
          where: { userId: input.userId, createdAt: MoreThan(since) },
        })
      : await this.enquiries.findOne({
          where: { ip: input.ip ?? '', createdAt: MoreThan(since) },
        });
    if (recent) {
      throw new HttpException(
        'Please wait before sending another message',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.enquiries.save(
      this.enquiries.create({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        subject: input.subject.trim(),
        message: input.message.trim(),
        status: 'open',
        userId: input.userId,
        ip: input.ip,
      }),
    );
  }
}
