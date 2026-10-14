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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { BadRequestException } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ChangePasswordDto } from '../auth/dto/auth.dto.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { coverAccepted } from '../content/content-rules.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import {
  BecomeWriterDto,
  InterestsDto,
  ModeDto,
  PreferencesDto,
  UpdateProfileDto,
} from './dto/profile.dto.js';
import { AccountService } from './account.service.js';
import { Role } from './role.js';
import { UsersService } from './users.service.js';

const avatarDir = 'uploads/avatars';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly accounts: AccountService,
  ) {}

  @ApiBearerAuth()
  @Get('users/me')
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id).then((record) => {
      if (!record) {
        return user;
      }
      return this.usersService.toPublic(record);
    });
  }

  @ApiBearerAuth()
  @Patch('users/me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @Post('users/me/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(avatarDir, { recursive: true });
          cb(null, avatarDir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async photo(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: { mimetype: string; size: number; filename: string },
  ) {
    if (!file || !coverAccepted(file.mimetype, file.size)) {
      throw new BadRequestException('Photo must be a jpeg, png, or webp under 2MB');
    }
    return this.usersService.setPhoto(user.id, `/uploads/avatars/${file.filename}`);
  }

  @ApiBearerAuth()
  @HttpCode(204)
  @Post('users/me/password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @ApiBearerAuth()
  @Post('users/me/mode')
  setMode(@CurrentUser() user: AuthUser, @Body() dto: ModeDto) {
    return this.usersService.setMode(user, dto.mode);
  }

  @ApiBearerAuth()
  @Post('users/me/become-writer')
  becomeWriter(@CurrentUser() user: AuthUser, @Body() dto: BecomeWriterDto) {
    return this.usersService.becomeWriter(user, dto);
  }

  @ApiBearerAuth()
  @Post('users/me/preferences')
  preferences(@CurrentUser() user: AuthUser, @Body() dto: PreferencesDto) {
    return this.usersService.setPreferences(user.id, dto);
  }

  @ApiBearerAuth()
  @Post('users/me/interests')
  interests(@CurrentUser() user: AuthUser, @Body() dto: InterestsDto) {
    return this.usersService.setInterests(user.id, dto.genres);
  }

  @ApiBearerAuth()
  @Delete('users/me')
  @HttpCode(204)
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.accounts.deleteAccount(user.id);
  }

  @Public()
  @Get('profiles/:id')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.publicProfile(id);
  }

  @ApiBearerAuth()
  @Patch('users/:id/role')
  @Roles(Role.SuperAdmin)
  updateRole(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(actor, id, dto.role);
  }
}
