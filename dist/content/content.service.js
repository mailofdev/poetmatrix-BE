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
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { canMutateContent, canReadContent, } from '../common/authorization/content-access.js';
import { Role } from '../users/role.js';
import { Content } from './content.entity.js';
let ContentService = class ContentService {
    contentRepository;
    constructor(contentRepository) {
        this.contentRepository = contentRepository;
    }
    create(dto, user) {
        if (user.role !== Role.Writer && user.role !== Role.SuperAdmin) {
            throw new ForbiddenException('You do not have access to this resource');
        }
        const content = this.contentRepository.create({
            title: dto.title,
            genre: dto.genre,
            saveAs: dto.saveAs,
            writings: dto.writings,
            authorId: user.id,
        });
        return this.contentRepository.save(content);
    }
    async findAll(user, page, limit) {
        const qb = this.contentRepository.createQueryBuilder('content');
        if (!user) {
            qb.where('content.saveAs = :published', { published: 'published' });
        }
        else if (user.role !== Role.SuperAdmin) {
            qb.where('(content.saveAs = :published OR content.authorId = :authorId)', { published: 'published', authorId: user.id });
        }
        qb.orderBy('content.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, meta: { page, limit, total } };
    }
    async findOne(id, user) {
        const content = await this.contentRepository.findOne({ where: { id } });
        if (!content || !canReadContent(content, user)) {
            throw new NotFoundException('Content not found');
        }
        return content;
    }
    async update(id, dto, user) {
        if (dto.title === undefined &&
            dto.genre === undefined &&
            dto.saveAs === undefined &&
            dto.writings === undefined) {
            throw new BadRequestException('At least one field is required');
        }
        const content = await this.requireMutable(id, user);
        Object.assign(content, dto);
        return this.contentRepository.save(content);
    }
    async remove(id, user) {
        const content = await this.requireMutable(id, user);
        await this.contentRepository.remove(content);
    }
    async requireMutable(id, user) {
        const content = await this.contentRepository.findOne({ where: { id } });
        if (!content || !canMutateContent(content, user)) {
            throw new NotFoundException('Content not found');
        }
        return content;
    }
};
ContentService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Content)),
    __metadata("design:paramtypes", [Repository])
], ContentService);
export { ContentService };
//# sourceMappingURL=content.service.js.map