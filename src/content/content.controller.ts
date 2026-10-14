import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { Role } from '../users/role.js';
import { ContentService } from './content.service.js';
import { coverAccepted, editorFeatures } from './content-rules.js';
import { SaveContentDto } from './dto/content.dto.js';

const coverDir = 'uploads/covers';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiBearerAuth()
  @Get('editor')
  @Roles(Role.Writer, Role.SuperAdmin)
  editor(@CurrentUser() user: AuthUser) {
    return editorFeatures(user.plan);
  }

  @ApiBearerAuth()
  @Get('mine')
  @Roles(Role.Writer, Role.SuperAdmin)
  mine(@CurrentUser() user: AuthUser) {
    return this.contentService.mine(user);
  }

  @ApiBearerAuth()
  @Get('usage')
  @Roles(Role.Writer, Role.SuperAdmin)
  usage(@CurrentUser() user: AuthUser) {
    return this.contentService.usageFor(user.id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(Role.Writer, Role.SuperAdmin)
  create(@Body() dto: SaveContentDto, @CurrentUser() user: AuthUser) {
    return this.contentService.create(dto, user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  catalog(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('genre') genre?: string,
  ) {
    return this.contentService.catalog(Number(limit ?? 20), cursor, genre);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.contentService.findOne(id, user ?? null);
  }

  @ApiBearerAuth()
  @Post(':id')
  @Roles(Role.Writer, Role.SuperAdmin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveContentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Post(':id/cover')
  @Roles(Role.Writer, Role.SuperAdmin)
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(coverDir, { recursive: true });
          cb(null, coverDir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  cover(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: { mimetype: string; size: number; filename: string },
  ) {
    if (!file || !coverAccepted(file.mimetype, file.size)) {
      throw new BadRequestException(
        'Cover must be a jpeg, png, or webp under 2MB',
      );
    }
    return this.contentService.setCover(
      id,
      user,
      `/uploads/covers/${file.filename}`,
    );
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.Writer, Role.SuperAdmin)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.remove(id, user);
  }
}
