export declare class Content {
    id: string;
    title: string;
    subtitle: string;
    writings: string;
    type: string;
    articleSubtype: string | null;
    tags: string;
    coverPath: string | null;
    language: string;
    saveAs: string;
    visibility: string;
    commentsAllowed: boolean;
    featured: boolean;
    boosted: boolean;
    genre: string;
    seriesTitle: string | null;
    seriesChapter: number | null;
    authorId: string | null;
    authorName: string;
    preview: string;
    readingMinutes: number;
    viewCount: number;
    limitReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PublishUsage {
    id: string;
    userId: string;
    contentId: string;
    monthKey: string;
    createdAt: Date;
}
export declare class SearchIndex {
    contentId: string;
    title: string;
    genre: string;
    authorId: string | null;
    authorName: string;
}
