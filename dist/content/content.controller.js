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
import * as openapi_import_1 from "./content.entity.js";
import * as openapi from "@nestjs/swagger";
import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { Role } from '../users/role.js';
import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
let ContentController = class ContentController {
    contentService;
    constructor(contentService) {
        this.contentService = contentService;
    }
    create(dto, user) {
        return this.contentService.create(dto, user);
    }
    findAll(query, user) {
        return this.contentService.findAll(user ?? null, query.page ?? 1, query.limit ?? 20);
    }
    findOne(id, user) {
        return this.contentService.findOne(id, user ?? null);
    }
    update(id, dto, user) {
        return this.contentService.update(id, dto, user);
    }
    remove(id, user) {
        return this.contentService.remove(id, user);
    }
};
__decorate([
    ApiBearerAuth(),
    Post(),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 201, type: openapi_import_1.Content }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "create", null);
__decorate([
    Public(),
    UseGuards(OptionalJwtAuthGuard),
    Get(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "findAll", null);
__decorate([
    Public(),
    UseGuards(OptionalJwtAuthGuard),
    Get(':id'),
    openapi.ApiResponse({ status: 200, type: openapi_import_1.Content }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "findOne", null);
__decorate([
    ApiBearerAuth(),
    Patch(':id'),
    Roles(Role.Writer, Role.SuperAdmin),
    openapi.ApiResponse({ status: 200, type: openapi_import_1.Content }),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "update", null);
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