import { type CliLanguage } from "./localization.js";
export { type CliLanguage };
export declare function formatWriteStartLine(language: CliLanguage, current: number, total: number, bookId: string): string;
export declare function formatWriteCompletionLines(language: CliLanguage, result: {
    readonly chapterNumber: number;
    readonly title: string;
    readonly wordCount: number;
    readonly passedAudit: boolean;
    readonly revised: boolean;
    readonly status: string;
    readonly issues: ReadonlyArray<{
        readonly severity: string;
        readonly category: string;
        readonly description: string;
    }>;
}): string[];
export declare function formatWriteDoneLine(language: CliLanguage): string;
export declare function formatImportDiscoveryLine(language: CliLanguage, chapterCount: number, bookId: string): string;
export declare function formatImportResumeLine(language: CliLanguage, resumeFrom: number): string;
export declare function formatImportCompletionLines(language: CliLanguage, result: {
    readonly importedCount: number;
    readonly totalCountLabel: string;
    readonly nextChapter: number;
    readonly bookId: string;
}): string[];
//# sourceMappingURL=progress-text.d.ts.map