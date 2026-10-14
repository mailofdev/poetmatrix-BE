import type { AuthUser } from '../common/types/auth-user.js';
import { ContentService } from './content.service.js';
import { SaveContentDto } from './dto/content.dto.js';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    editor(user: AuthUser): {
        formatting: boolean;
        links: boolean;
        images: boolean;
        tables: boolean;
        alignment: boolean;
        video: boolean;
        source: boolean;
        fullscreen: boolean;
    };
    mine(user: AuthUser): Promise<import("./content.service.js").ContentView[]>;
    usage(user: AuthUser): Promise<{
        plan: string;
        used: number;
        cap: number | null;
        month: string;
    }>;
    create(dto: SaveContentDto, user: AuthUser): Promise<import("./content.service.js").ContentView>;
    catalog(limit?: string, cursor?: string, genre?: string): Promise<{
        data: import("./content.service.js").ContentView[];
        nextCursor: string | null;
    }>;
    findOne(id: string, user?: AuthUser): Promise<import("./content.service.js").ContentView>;
    update(id: string, dto: SaveContentDto, user: AuthUser): Promise<import("./content.service.js").ContentView>;
    cover(id: string, user: AuthUser, file?: {
        mimetype: string;
        size: number;
        filename: string;
    }): Promise<import("./content.service.js").ContentView>;
    remove(id: string, user: AuthUser): Promise<void>;
}
