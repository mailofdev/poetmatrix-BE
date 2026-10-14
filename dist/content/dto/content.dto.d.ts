export declare class SaveContentDto {
    title: string;
    subtitle?: string;
    body: string;
    type?: 'story' | 'article';
    articleSubtype?: string;
    tags?: string;
    language?: string;
    status: 'draft' | 'published';
    visibility?: 'public' | 'private' | 'premium';
    commentsAllowed?: boolean;
    genre?: string;
    seriesTitle?: string;
    seriesChapter?: number;
}
