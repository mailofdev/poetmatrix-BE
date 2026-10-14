var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
let Content = class Content {
    id;
    title;
    genre;
    saveAs;
    writings;
    createdAt;
    updatedAt;
};
__decorate([
    ApiProperty({ format: 'uuid' }),
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Content.prototype, "id", void 0);
__decorate([
    ApiProperty(),
    Column(),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    ApiProperty(),
    Column(),
    __metadata("design:type", String)
], Content.prototype, "genre", void 0);
__decorate([
    ApiProperty(),
    Column({ name: 'save_as' }),
    __metadata("design:type", String)
], Content.prototype, "saveAs", void 0);
__decorate([
    ApiProperty(),
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Content.prototype, "writings", void 0);
__decorate([
    ApiProperty(),
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Content.prototype, "createdAt", void 0);
__decorate([
    ApiProperty(),
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Content.prototype, "updatedAt", void 0);
Content = __decorate([
    Entity('contents')
], Content);
export { Content };
//# sourceMappingURL=content.entity.js.map