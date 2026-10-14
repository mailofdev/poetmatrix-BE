import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Mode, Plan, Role } from './role.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 320 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 32, default: Role.Reader })
  role: Role;

  @Column({ type: 'simple-array', default: Role.Reader })
  roles: Role[];

  @Column({ length: 16, default: Mode.Reader })
  mode: Mode;

  @Column({ length: 16, default: Plan.Free })
  plan: Plan;

  @Column({ name: 'reader_subscription', default: true })
  readerSubscription: boolean;

  @Column({ name: 'writer_subscription', default: false })
  writerSubscription: boolean;

  @Column({ name: 'display_name', type: 'varchar', length: 120, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio: string | null;

  @Column({ name: 'pen_name', type: 'varchar', length: 120, nullable: true })
  penName: string | null;

  @Column({ name: 'photo_path', type: 'varchar', length: 500, nullable: true })
  photoPath: string | null;

  @Column({ type: 'simple-array', default: '' })
  interests: string[];

  @Column({ name: 'interests_completed', default: false })
  interestsCompleted: boolean;

  @Column({ name: 'push_enabled', default: false })
  pushEnabled: boolean;

  @Column({ length: 16, default: 'system' })
  theme: string;

  @Column({ name: 'follower_count', default: 0 })
  followerCount: number;

  @Column({ name: 'following_count', default: 0 })
  followingCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
