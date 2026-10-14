import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { Role } from '../users/role.js';
import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiBearerAuth()
  @Post()
  @Roles(Role.Writer, Role.SuperAdmin)
  create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthUser) {
    return this.contentService.create(dto, user);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.contentService.findAll(
      user ?? null,
      query.page ?? 1,
      query.limit ?? 20,
    );
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
  @Patch(':id')
  @Roles(Role.Writer, Role.SuperAdmin)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contentService.update(id, dto, user);
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
