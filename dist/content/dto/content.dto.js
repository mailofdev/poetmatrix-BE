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
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
export const SAVE_AS_VALUES = ['draft', 'published'];
export class CreateContentDto {
    title;
    genre;
    saveAs;
    writings;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, genre: { required: true, type: () => String, minLength: 1, maxLength: 80 }, saveAs: { required: true, enum: ["published", "draft"], enum: SAVE_AS_VALUES }, writings: { required: true, type: () => String, minLength: 1, maxLength: 100000 } };
    }
}
__decorate([
    ApiProperty({ example: 'Night Garden', maxLength: 200 }),
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], CreateContentDto.prototype, "title", void 0);
__decorate([
    ApiProperty({ example: 'lyric', maxLength: 80 }),
    IsString(),
    MinLength(1),
    MaxLength(80),
    __metadata("design:type", String)
], CreateContentDto.prototype, "genre", void 0);
__decorate([
    ApiProperty({ enum: SAVE_AS_VALUES, example: 'draft' }),
    IsIn(SAVE_AS_VALUES),
    __metadata("design:type", String)
], CreateContentDto.prototype, "saveAs", void 0);
__decorate([
    ApiProperty({ example: 'The moon keeps a quiet ledger of the trees.' }),
    IsString(),
    MinLength(1),
    MaxLength(100_000),
    __metadata("design:type", String)
], CreateContentDto.prototype, "writings", void 0);
export class UpdateContentDto extends PartialType(CreateContentDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
//# sourceMappingURL=content.dto.js.map