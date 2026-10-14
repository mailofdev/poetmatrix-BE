var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import * as openapi from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';
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
import { Role } from '../users/role.js';
import { ContentService } from './content.service.js';
import { coverAccepted, editorFeatures } from './content-rules.js';
import { SaveContentDto } from './dto/content.dto.js';
const coverDir = 'uploads/covers';
let ContentController = class ContentController {
    contentService;
    constructor(contentService) {
        this.contentService = contentService;
    }
    editor(user) {
        return editorFeatures(user.plan);
    }
    mine(user) {
        return this.contentService.mine(user);
    }
    usage(user) {
        return this.contentService.usageFor(user.id);
    }
    create(dto, user) {
        return this.contentService.create(dto, user);
    }
    catalog(limit, cursor, genre) {
        return this.contentService.catalog(Number(limit ?? 20), cursor, genre);
    }
    findOne(id, user) {
        return this.contentService.findOne(id, user ?? null);
    }
    update(id, dto, user) {
        return this.contentService.update(id, dto, user);
    }
    cover(id, user, file) {
        if (!file || !coverAccepted(file.mimetype, file.size)) {
            throw new BadRequestException('Cover must be a jpeg, png, or webp under 2MB');
        }
        return this.contentService.setCover(id, user, `/uploads/covers/${file.filename}`);
    }
    remove(id, user) {
        return this.contentService.remove(id, user);
    }
};
__decorate([
    ApiBearerAuth(),
    Get('editor'),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 200 }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "editor", null);
__decorate([
    ApiBearerAuth(),
    Get('mine'),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "mine", null);
__decorate([
    ApiBearerAuth(),
    Get('usage'),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 200 }),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "usage", null);
__decorate([
    ApiBearerAuth(),
    Post(),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SaveContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "create", null);
__decorate([
    openapi.ApiQuery({ name: "limit", required: false }),
    openapi.ApiQuery({ name: "cursor", required: false }),
    openapi.ApiQuery({ name: "genre", required: false }),
    Public(),
    UseGuards(OptionalJwtAuthGuard),
    Get(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, Query('limit')),
    __param(1, Query('cursor')),
    __param(2, Query('genre')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "catalog", null);
__decorate([
    Public(),
    UseGuards(OptionalJwtAuthGuard),
    Get(':id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "findOne", null);
__decorate([
    ApiBearerAuth(),
    Post(':id'),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SaveContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "update", null);
__decorate([
    ApiBearerAuth(),
    Post(':id/cover'),
    Roles(Role.Writer, Role.SuperAdmin),
    UseInterceptors(FileInterceptor('cover', {
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
    })),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, CurrentUser()),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "cover", null);
__decorate([
    ApiBearerAuth(),
    Delete(':id'),
    HttpCode(204),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 204 }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "remove", null);
ContentController = __decorate([
    ApiTags('content'),
    Controller('content'),
    __metadata("design:paramtypes", [ContentService])
], ContentController);
export { ContentController };
//# sourceMappingURL=content.controller.js.map