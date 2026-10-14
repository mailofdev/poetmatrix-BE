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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './content.entity.js';
let ContentService = class ContentService {
    contentRepository;
    constructor(contentRepository) {
        this.contentRepository = contentRepository;
    }
    create(dto) {
        const content = this.contentRepository.create(dto);
        return this.contentRepository.save(content);
    }
    findAll() {
        return this.contentRepository.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const content = await this.contentRepository.findOne({ where: { id } });
        if (!content) {
            throw new NotFoundException(`Content ${id} not found`);
        }
        return content;
    }
    async update(id, dto) {
        const content = await this.findOne(id);
        Object.assign(content, dto);
        return this.contentRepository.save(content);
    }
    async remove(id) {
        const content = await this.findOne(id);
        await this.contentRepository.remove(content);
    }
};
ContentService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Content)),
    __metadata("design:paramtypes", [Repository])
], ContentService);
export { ContentService };
//# sourceMappingURL=content.service.js.map