import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('site_config')
export class SiteConfig {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ name: 'hero_title', default: 'PoetMatrix' })
  heroTitle: string;

  @Column({ name: 'hero_subtitle' })
  heroSubtitle: string;

  @Column({ name: 'about_teaser', type: 'text', default: '' })
  aboutTeaser: string;

  @Column({ name: 'policies_note', type: 'text', default: '' })
  policiesNote: string;

  @Column({ name: 'seo_title' })
  seoTitle: string;

  @Column({ name: 'seo_description' })
  seoDescription: string;

  @Column({ name: 'comments_globally_enabled', default: true })
  commentsGloballyEnabled: boolean;

  @Column({ name: 'push_master_enabled', default: false })
  pushMasterEnabled: boolean;

  @Column({ name: 'maintenance_mode', default: false })
  maintenanceMode: boolean;

  @Column({ name: 'require_email_verification', default: false })
  requireEmailVerification: boolean;

  @Column({ name: 'session_timeout_minutes', type: 'int', nullable: true })
  sessionTimeoutMinutes: number | null;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'role_policy_notes', type: 'text', default: '' })
  rolePolicyNotes: string;
}

@Entity('blocked_keywords')
export class BlockedKeyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80, unique: true })
  word: string;
}

@Entity('landing_cache')
export class LandingCache {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @UpdateDateColumn({ name: 'refreshed_at', type: 'timestamptz' })
  refreshedAt: Date;
}
