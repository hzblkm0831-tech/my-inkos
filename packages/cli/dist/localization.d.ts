export type CliLanguage = "zh" | "en";
type WriteIssue = {
    readonly severity: string;
    readonly category: string;
    readonly description: string;
};
type WriteResultShape = {
    readonly chapterNumber: number;
    readonly title: string;
    readonly wordCount: number;
    readonly status: string;
    readonly revised: boolean;
    readonly issues: ReadonlyArray<WriteIssue>;
    readonly auditPassed?: boolean;
    readonly passedAudit?: boolean;
};
type ImportResultShape = {
    readonly importedCount: number;
    readonly totalWords: number;
    readonly nextChapter: number;
    readonly continueBookId: string;
};
export declare function resolveCliLanguage(language?: string): CliLanguage;
export declare function formatBookCreateCreating(language: CliLanguage, title: string, genre: string, platform: string): string;
export declare function formatBookCreateCreated(language: CliLanguage, bookId: string): string;
export declare function formatBookCreateLocation(language: CliLanguage, bookId: string): string;
export declare function formatBookCreateFoundationReady(language: CliLanguage): string;
export declare function formatBookCreateNextStep(language: CliLanguage, bookId: string): string;
export declare function formatWriteNextProgress(language: CliLanguage, current: number, total: number, bookId: string): string;
export declare function formatWriteNextResultLines(language: CliLanguage, result: WriteResultShape): string[];
export declare function formatWriteNextComplete(language: CliLanguage): string;
export declare function formatImportChaptersDiscovery(language: CliLanguage, chapterCount: number, bookId: string): string;
export declare function formatImportChaptersResume(language: CliLanguage, resumeFrom: number): string;
export declare function formatImportChaptersComplete(language: CliLanguage, result: ImportResultShape): string[];
export declare function formatImportCanonStart(language: CliLanguage, parentBookId: string, targetBookId: string): string;
export declare function formatImportCanonComplete(language: CliLanguage): string[];
export {};
//# sourceMappingURL=localization.d.ts.map