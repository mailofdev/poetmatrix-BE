import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contents')
export class Content {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column()
  genre: string;

  @ApiProperty()
  @Index()
  @Column({ name: 'save_as' })
  saveAs: string;

  @ApiProperty()
  @Column({ type: 'text' })
  writings: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  @Index()
  @Column({ name: 'author_id', type: 'uuid', nullable: true })
  authorId: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
