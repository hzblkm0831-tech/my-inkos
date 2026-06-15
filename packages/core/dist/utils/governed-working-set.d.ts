import type { ContextPackage } from "../models/input-governance.js";
export declare function buildGovernedHookWorkingSet(params: {
    readonly hooksMarkdown: string;
    readonly contextPackage: ContextPackage;
    readonly chapterIntent?: string;
    readonly chapterNumber: number;
    readonly language: "zh" | "en";
    readonly keepRecent?: number;
}): string;
export declare function mergeTableMarkdownByKey(original: string, updated: string, keyColumns: ReadonlyArray<number>): string;
export declare function mergeCharacterMatrixMarkdown(original: string, updated: string): string;
export declare function buildGovernedCharacterMatrixWorkingSet(params: {
    readonly matrixMarkdown: string;
    readonly chapterIntent: string;
    readonly contextPackage: ContextPackage;
    readonly protagonistName?: string;
}): string;
//# sourceMappingURL=governed-working-set.d.ts.map