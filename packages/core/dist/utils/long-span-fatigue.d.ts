export interface LongSpanFatigueIssue {
    readonly severity: "warning";
    readonly category: string;
    readonly description: string;
    readonly suggestion: string;
}
export interface AnalyzeLongSpanFatigueInput {
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly chapterContent: string;
    readonly chapterSummary?: string;
    readonly language?: "zh" | "en";
}
export interface EnglishVarianceBrief {
    readonly highFrequencyPhrases: ReadonlyArray<string>;
    readonly repeatedOpeningPatterns: ReadonlyArray<string>;
    readonly repeatedEndingShapes: ReadonlyArray<string>;
    readonly sceneObligation: string;
    readonly text: string;
}
export declare function buildEnglishVarianceBrief(params: {
    readonly bookDir: string;
    readonly chapterNumber: number;
}): Promise<EnglishVarianceBrief | null>;
export declare function analyzeLongSpanFatigue(input: AnalyzeLongSpanFatigueInput): Promise<{
    readonly issues: ReadonlyArray<LongSpanFatigueIssue>;
}>;
//# sourceMappingURL=long-span-fatigue.d.ts.map