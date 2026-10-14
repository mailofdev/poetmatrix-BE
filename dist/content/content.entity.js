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
import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
let Content = class Content {
    id;
    title;
    subtitle;
    writings;
    type;
    articleSubtype;
    tags;
    coverPath;
    language;
    saveAs;
    visibility;
    commentsAllowed;
    featured;
    boosted;
    genre;
    seriesTitle;
    seriesChapter;
    authorId;
    authorName;
    preview;
    readingMinutes;
    viewCount;
    limitReason;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, subtitle: { required: true, type: () => String }, writings: { required: true, type: () => String }, type: { required: true, type: () => String }, articleSubtype: { required: true, type: () => String, nullable: true }, tags: { required: true, type: () => String }, coverPath: { required: true, type: () => String, nullable: true }, language: { required: true, type: () => String }, saveAs: { required: true, type: () => String }, visibility: { required: true, type: () => String }, commentsAllowed: { required: true, type: () => Boolean }, featured: { required: true, type: () => Boolean }, boosted: { required: true, type: () => Boolean }, genre: { required: true, type: () => String }, seriesTitle: { required: true, type: () => String, nullable: true }, seriesChapter: { required: true, type: () => Number, nullable: true }, authorId: { required: true, type: () => String, nullable: true }, authorName: { required: true, type: () => String }, preview: { required: true, type: () => String }, readingMinutes: { required: true, type: () => Number }, viewCount: { required: true, type: () => Number }, limitReason: { required: true, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
__decorate([
    ApiProperty({ format: 'uuid' }),
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Content.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Content.prototype, "title", void 0);
__decorate([
    Column({ default: '' }),
    __metadata("design:type", String)
], Content.prototype, "subtitle", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Content.prototype, "writings", void 0);
__decorate([
    Column({ default: 'story' }),
    __metadata("design:type", String)
], Content.prototype, "type", void 0);
__decorate([
    Column({ name: 'article_subtype', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "articleSubtype", void 0);
__decorate([
    Column({ default: '' }),
    __metadata("design:type", String)
], Content.prototype, "tags", void 0);
__decorate([
    Column({ name: 'cover_path', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "coverPath", void 0);
__decorate([
    Column({ default: 'en' }),
    __metadata("design:type", String)
], Content.prototype, "language", void 0);
__decorate([
    Index(),
    Column({ name: 'save_as' }),
    __metadata("design:type", String)
], Content.prototype, "saveAs", void 0);
__decorate([
    Column({ default: 'private' }),
    __metadata("design:type", String)
], Content.prototype, "visibility", void 0);
__decorate([
    Column({ name: 'comments_allowed', default: true }),
    __metadata("design:type", Boolean)
], Content.prototype, "commentsAllowed", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Content.prototype, "featured", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Content.prototype, "boosted", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Content.prototype, "genre", void 0);
__decorate([
    Column({ name: 'series_title', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "seriesTitle", void 0);
__decorate([
    Column({ name: 'series_chapter', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "seriesChapter", void 0);
__decorate([
    Index(),
    Column({ name: 'author_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "authorId", void 0);
__decorate([
    Column({ name: 'author_name', default: '' }),
    __metadata("design:type", String)
], Content.prototype, "authorName", void 0);
__decorate([
    Column({ type: 'text', default: '' }),
    __metadata("design:type", String)
], Content.prototype, "preview", void 0);
__decorate([
    Column({ name: 'reading_minutes', default: 1 }),
    __metadata("design:type", Number)
], Content.prototype, "readingMinutes", void 0);
__decorate([
    Column({ name: 'view_count', default: 0 }),
    __metadata("design:type", Number)
], Content.prototype, "viewCount", void 0);
__decorate([
    Column({ name: 'limit_reason', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Content.prototype, "limitReason", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Content.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Content.prototype, "updatedAt", void 0);
Content = __decorate([
    Entity('contents')
], Content);
export { Content };
let PublishUsage = class PublishUsage {
    id;
    userId;
    contentId;
    monthKey;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, contentId: { required: true, type: () => String }, monthKey: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], PublishUsage.prototype, "id", void 0);
__decorate([
    Column({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], PublishUsage.prototype, "userId", void 0);
__decorate([
    Column({ name: 'content_id', type: 'uuid' }),
    __metadata("design:type", String)
], PublishUsage.prototype, "contentId", void 0);
__decorate([
    Column({ name: 'month_key', length: 7 }),
    __metadata("design:type", String)
], PublishUsage.prototype, "monthKey", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PublishUsage.prototype, "createdAt", void 0);
PublishUsage = __decorate([
    Entity('publish_usage')
], PublishUsage);
export { PublishUsage };
let SearchIndex = class SearchIndex {
    contentId;
    title;
    genre;
    authorId;
    authorName;
    static _OPENAPI_METADATA_FACTORY() {
        return { contentId: { required: true, type: () => String }, title: { required: true, type: () => String }, genre: { required: true, type: () => String }, authorId: { required: true, type: () => String, nullable: true }, authorName: { required: true, type: () => String } };
    }
};
__decorate([
    PrimaryColumn({ name: 'content_id', type: 'uuid' }),
    __metadata("design:type", String)
], SearchIndex.prototype, "contentId", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], SearchIndex.prototype, "title", void 0);
__decorate([
    Column({ default: '' }),
    __metadata("design:type", String)
], SearchIndex.prototype, "genre", void 0);
__decorate([
    Column({ name: 'author_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], SearchIndex.prototype, "authorId", void 0);
__decorate([
    Column({ name: 'author_name', default: '' }),
    __metadata("design:type", String)
], SearchIndex.prototype, "authorName", void 0);
SearchIndex = __decorate([
    Entity('search_index')
], SearchIndex);
export { SearchIndex };
//# sourceMappingURL=content.entity.js.map