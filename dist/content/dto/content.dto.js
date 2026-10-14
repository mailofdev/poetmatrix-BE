var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateContentDto {
    title;
    genre;
    saveAs;
    writings;
}
__decorate([
    ApiProperty({ example: 'Night Garden' }),
    __metadata("design:type", String)
], CreateContentDto.prototype, "title", void 0);
__decorate([
    ApiProperty({ example: 'lyric' }),
    __metadata("design:type", String)
], CreateContentDto.prototype, "genre", void 0);
__decorate([
    ApiProperty({ example: 'draft' }),
    __metadata("design:type", String)
], CreateContentDto.prototype, "saveAs", void 0);
__decorate([
    ApiProperty({ example: 'The moon keeps a quiet ledger of the trees.' }),
    __metadata("design:type", String)
], CreateContentDto.prototype, "writings", void 0);
export class UpdateContentDto {
    title;
    genre;
    saveAs;
    writings;
}
__decorate([
    ApiPropertyOptional({ example: 'Night Garden' }),
    __metadata("design:type", String)
], UpdateContentDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ example: 'lyric' }),
    __metadata("design:type", String)
], UpdateContentDto.prototype, "genre", void 0);
__decorate([
    ApiPropertyOptional({ example: 'published' }),
    __metadata("design:type", String)
], UpdateContentDto.prototype, "saveAs", void 0);
__decorate([
    ApiPropertyOptional({
        example: 'The moon keeps a quiet ledger of the trees.',
    }),
    __metadata("design:type", String)
], UpdateContentDto.prototype, "writings", void 0);
//# sourceMappingURL=content.dto.js.map