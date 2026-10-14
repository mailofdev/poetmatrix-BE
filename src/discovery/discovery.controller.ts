import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { Role } from '../users/role.js';
import { UsersService } from '../users/users.service.js';
import { DiscoveryService } from './discovery.service.js';

@ApiTags('discovery')
@Controller()
export class DiscoveryController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Get('discovery/home')
  home() {
    return this.discovery.home();
  }

  @Public()
  @Get('search')
  search(
    @Query('q') q = '',
    @Query('genre') genre?: string,
    @Query('writer') writer?: string,
  ) {
    return this.discovery.search(q, genre, writer);
  }

  @Public()
  @Get('trending')
  trending() {
    return this.discovery.trending();
  }

  @Public()
  @Get('writers')
  writers() {
    return this.discovery.directory();
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('recommendations')
  async recommendations(@CurrentUser() user?: AuthUser) {
    if (!user) {
      return this.discovery.trending();
    }
    const record = await this.users.findById(user.id);
    return this.discovery.recommendations(record?.interests ?? []);
  }

  @ApiBearerAuth()
  @Post('admin/landing/refresh')
  @Roles(Role.SuperAdmin)
  refresh() {
    return this.discovery.refreshLanding();
  }
}
