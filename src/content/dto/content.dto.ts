import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const SAVE_AS_VALUES = ['draft', 'published'] as const;
export type SaveAsValue = (typeof SAVE_AS_VALUES)[number];

export class CreateContentDto {
  @ApiProperty({ example: 'Night Garden', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'lyric', maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  genre: string;

  @ApiProperty({ enum: SAVE_AS_VALUES, example: 'draft' })
  @IsIn(SAVE_AS_VALUES)
  saveAs: SaveAsValue;

  @ApiProperty({ example: 'The moon keeps a quiet ledger of the trees.' })
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  writings: string;
}

export class UpdateContentDto extends PartialType(CreateContentDto) {}
