export declare const SAVE_AS_VALUES: readonly ["draft", "published"];
export type SaveAsValue = (typeof SAVE_AS_VALUES)[number];
export declare class CreateContentDto {
    title: string;
    genre: string;
    saveAs: SaveAsValue;
    writings: string;
}
declare const UpdateContentDto_base: import("@nestjs/common").Type<Partial<CreateContentDto>>;
export declare class UpdateContentDto extends UpdateContentDto_base {
}
export {};
