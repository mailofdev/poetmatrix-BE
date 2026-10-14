import { Repository } from 'typeorm';
import { Content } from './content.entity.js';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto.js';
export declare class ContentService {
    private readonly contentRepository;
    constructor(contentRepository: Repository<Content>);
    create(dto: CreateContentDto): Promise<Content>;
    findAll(): Promise<Content[]>;
    findOne(id: string): Promise<Content>;
    update(id: string, dto: UpdateContentDto): Promise<Content>;
    remove(id: string): Promise<void>;
}
