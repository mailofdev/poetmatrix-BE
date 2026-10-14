import { Repository } from 'typeorm';
import type { AuthUser } from '../common/types/auth-user.js';
import { Content } from './content.entity.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
export type ContentPage = {
    data: Content[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
};
export declare class ContentService {
    private readonly contentRepository;
    constructor(contentRepository: Repository<Content>);
    create(dto: CreateContentDto, user: AuthUser): Promise<Content>;
    findAll(user: AuthUser | null, page: number, limit: number): Promise<ContentPage>;
    findOne(id: string, user: AuthUser | null): Promise<Content>;
    update(id: string, dto: UpdateContentDto, user: AuthUser): Promise<Content>;
    remove(id: string, user: AuthUser): Promise<void>;
    private requireMutable;
}
