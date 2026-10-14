import { ContentService } from './content.service.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
import { Content } from './content.entity.js';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    create(dto: CreateContentDto): Promise<Content>;
    findAll(): Promise<Content[]>;
    findOne(id: string): Promise<Content>;
    update(id: string, dto: UpdateContentDto): Promise<Content>;
    remove(id: string): Promise<void>;
}
