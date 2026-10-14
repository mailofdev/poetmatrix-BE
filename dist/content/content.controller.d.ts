import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import type { AuthUser } from '../common/types/auth-user.js';
import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    create(dto: CreateContentDto, user: AuthUser): Promise<import("./content.entity.js").Content>;
    findAll(query: PaginationQueryDto, user?: AuthUser): Promise<import("./content.service.js").ContentPage>;
    findOne(id: string, user?: AuthUser): Promise<import("./content.entity.js").Content>;
    update(id: string, dto: UpdateContentDto, user: AuthUser): Promise<import("./content.entity.js").Content>;
    remove(id: string, user: AuthUser): Promise<void>;
}
