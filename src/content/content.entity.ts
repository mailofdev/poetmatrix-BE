import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contents')
export class Content {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: '' })
  subtitle: string;

  @Column({ type: 'text' })
  writings: string;

  @Column({ default: 'story' })
  type: string;

  @Column({ name: 'article_subtype', type: 'varchar', nullable: true })
  articleSubtype: string | null;

  @Column({ default: '' })
  tags: string;

  @Column({ name: 'cover_path', type: 'varchar', nullable: true })
  coverPath: string | null;

  @Column({ default: 'en' })
  language: string;

  @Index()
  @Column({ name: 'save_as' })
  saveAs: string;

  @Column({ default: 'private' })
  visibility: string;

  @Column({ name: 'comments_allowed', default: true })
  commentsAllowed: boolean;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: false })
  boosted: boolean;

  @Column()
  genre: string;

  @Column({ name: 'series_title', type: 'varchar', nullable: true })
  seriesTitle: string | null;

  @Column({ name: 'series_chapter', type: 'int', nullable: true })
  seriesChapter: number | null;

  @Index()
  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @Column({ name: 'author_name', default: '' })
  authorName: string;

  @Column({ type: 'text', default: '' })
  preview: string;

  @Column({ name: 'reading_minutes', default: 1 })
  readingMinutes: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'limit_reason', type: 'varchar', nullable: true })
  limitReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('publish_usage')
export class PublishUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @Column({ name: 'month_key', length: 7 })
  monthKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity('search_index')
export class SearchIndex {
  @PrimaryColumn({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ default: '' })
  genre: string;

  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @Column({ name: 'author_name', default: '' })
  authorName: string;
}
