import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GENRES } from '../../content/content-rules.js';
import { Mode } from '../role.js';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\- ]{8,20}$/, {
    message: 'phone must be 8–20 characters from digits, plus, hyphen, and spaces',
  })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  penName?: string;
}

export class BecomeWriterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  penName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  bio: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\- ]{8,20}$/)
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  gender: string;
}

export class ModeDto {
  @ApiProperty({ enum: Mode })
  @IsIn([Mode.Reader, Mode.Writer])
  mode: Mode;
}

export class PreferencesDto {
  @ApiPropertyOptional({ enum: ['system', 'light', 'dark'] })
  @IsOptional()
  @IsIn(['system', 'light', 'dark'])
  theme?: 'system' | 'light' | 'dark';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;
}

export class InterestsDto {
  @ApiProperty({ isArray: true })
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(GENRES, { each: true })
  genres: string[];
}
