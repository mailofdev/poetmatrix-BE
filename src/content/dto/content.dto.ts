import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContentDto {
  @ApiProperty({ example: 'Night Garden' })
  title: string;

  @ApiProperty({ example: 'lyric' })
  genre: string;

  @ApiProperty({ example: 'draft' })
  saveAs: string;

  @ApiProperty({ example: 'The moon keeps a quiet ledger of the trees.' })
  writings: string;
}

export class UpdateContentDto {
  @ApiPropertyOptional({ example: 'Night Garden' })
  title?: string;

  @ApiPropertyOptional({ example: 'lyric' })
  genre?: string;

  @ApiPropertyOptional({ example: 'published' })
  saveAs?: string;

  @ApiPropertyOptional({
    example: 'The moon keeps a quiet ledger of the trees.',
  })
  writings?: string;
}
