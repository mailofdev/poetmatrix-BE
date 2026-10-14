import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ARTICLE_SUBTYPES, GENRES } from '../content-rules.js';

export class SaveContentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  body: string;

  @ApiPropertyOptional({ enum: ['story', 'article'] })
  @IsOptional()
  @IsIn(['story', 'article'])
  type?: 'story' | 'article';

  @ApiPropertyOptional({ enum: ARTICLE_SUBTYPES })
  @IsOptional()
  @IsIn(ARTICLE_SUBTYPES)
  articleSubtype?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  language?: string;

  @ApiProperty({ enum: ['draft', 'published'] })
  @IsIn(['draft', 'published'])
  status: 'draft' | 'published';

  @ApiPropertyOptional({ enum: ['public', 'private', 'premium'] })
  @IsOptional()
  @IsIn(['public', 'private', 'premium'])
  visibility?: 'public' | 'private' | 'premium';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commentsAllowed?: boolean;

  @ApiPropertyOptional({ enum: GENRES })
  @IsOptional()
  @IsIn(GENRES)
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  seriesTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  seriesChapter?: number;
}
