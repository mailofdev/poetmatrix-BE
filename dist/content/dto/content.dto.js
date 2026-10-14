var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import * as openapi from "@nestjs/swagger";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, } from 'class-validator';
import { ARTICLE_SUBTYPES, GENRES } from '../content-rules.js';
export class SaveContentDto {
    title;
    subtitle;
    body;
    type;
    articleSubtype;
    tags;
    language;
    status;
    visibility;
    commentsAllowed;
    genre;
    seriesTitle;
    seriesChapter;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, subtitle: { required: false, type: () => String, maxLength: 300 }, body: { required: true, type: () => String, minLength: 1, maxLength: 100000 }, type: { required: false, enum: ["story", "article"], enum: ['story', 'article'] }, articleSubtype: { required: false, type: () => String, enum: ARTICLE_SUBTYPES }, tags: { required: false, type: () => String, maxLength: 300 }, language: { required: false, type: () => String, maxLength: 16 }, status: { required: true, enum: ["draft", "published"], enum: ['draft', 'published'] }, visibility: { required: false, enum: ["private", "premium", "public"], enum: ['public', 'private', 'premium'] }, commentsAllowed: { required: false, type: () => Boolean }, genre: { required: false, type: () => String, enum: GENRES }, seriesTitle: { required: false, type: () => String, maxLength: 200 }, seriesChapter: { required: false, type: () => Number, minimum: 1, maximum: 999 } };
    }
}
__decorate([
    ApiProperty(),
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], SaveContentDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], SaveContentDto.prototype, "subtitle", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    MinLength(1),
    MaxLength(100_000),
    __metadata("design:type", String)
], SaveContentDto.prototype, "body", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['story', 'article'] }),
    IsOptional(),
    IsIn(['story', 'article']),
    __metadata("design:type", String)
], SaveContentDto.prototype, "type", void 0);
__decorate([
    ApiPropertyOptional({ enum: ARTICLE_SUBTYPES }),
    IsOptional(),
    IsIn(ARTICLE_SUBTYPES),
    __metadata("design:type", String)
], SaveContentDto.prototype, "articleSubtype", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(300),
    __metadata("design:type", String)
], SaveContentDto.prototype, "tags", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(16),
    __metadata("design:type", String)
], SaveContentDto.prototype, "language", void 0);
__decorate([
    ApiProperty({ enum: ['draft', 'published'] }),
    IsIn(['draft', 'published']),
    __metadata("design:type", String)
], SaveContentDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['public', 'private', 'premium'] }),
    IsOptional(),
    IsIn(['public', 'private', 'premium']),
    __metadata("design:type", String)
], SaveContentDto.prototype, "visibility", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], SaveContentDto.prototype, "commentsAllowed", void 0);
__decorate([
    ApiPropertyOptional({ enum: GENRES }),
    IsOptional(),
    IsIn(GENRES),
    __metadata("design:type", String)
], SaveContentDto.prototype, "genre", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], SaveContentDto.prototype, "seriesTitle", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsInt(),
    Min(1),
    Max(999),
    __metadata("design:type", Number)
], SaveContentDto.prototype, "seriesChapter", void 0);
//# sourceMappingURL=content.dto.js.map