export interface TokenStats {
    readonly totalPromptTokens: number;
    readonly totalCompletionTokens: number;
    readonly totalTokens: number;
    readonly avgTokensPerChapter: number;
    readonly recentTrend: ReadonlyArray<{
        readonly chapter: number;
        readonly totalTokens: number;
    }>;
}
export interface AnalyticsData {
    readonly bookId: string;
    readonly totalChapters: number;
    readonly totalWords: number;
    readonly avgWordsPerChapter: number;
    readonly auditPassRate: number;
    readonly topIssueCategories: ReadonlyArray<{
        readonly category: string;
        readonly count: number;
    }>;
    readonly chaptersWithMostIssues: ReadonlyArray<{
        readonly chapter: number;
        readonly issueCount: number;
    }>;
    readonly statusDistribution: Record<string, number>;
    readonly tokenStats?: TokenStats;
}
export declare function computeAnalytics(bookId: string, chapters: ReadonlyArray<{
    readonly number: number;
    readonly status: string;
    readonly wordCount: number;
    readonly auditIssues: ReadonlyArray<string>;
    readonly tokenUsage?: {
        readonly promptTokens: number;
        readonly completionTokens: number;
        readonly totalTokens: number;
    };
}>): AnalyticsData;
//# sourceMappingURL=analytics.d.ts.map