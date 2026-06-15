export interface CadenceSummaryRow {
    readonly chapter: number;
    readonly title: string;
    readonly mood: string;
    readonly chapterType: string;
}
export interface SceneCadencePressure {
    readonly pressure: "medium" | "high";
    readonly repeatedType: string;
    readonly streak: number;
}
export interface MoodCadencePressure {
    readonly pressure: "medium" | "high";
    readonly highTensionStreak: number;
    readonly recentMoods: ReadonlyArray<string>;
}
export interface TitleCadencePressure {
    readonly pressure: "medium" | "high";
    readonly repeatedToken: string;
    readonly count: number;
    readonly recentTitles: ReadonlyArray<string>;
}
export interface ChapterCadenceAnalysis {
    readonly scenePressure?: SceneCadencePressure;
    readonly moodPressure?: MoodCadencePressure;
    readonly titlePressure?: TitleCadencePressure;
}
export declare const DEFAULT_CHAPTER_CADENCE_WINDOW: 4;
export declare function analyzeChapterCadence(params: {
    readonly rows: ReadonlyArray<CadenceSummaryRow>;
    readonly language: "zh" | "en";
}): ChapterCadenceAnalysis;
export declare function isHighTensionMood(mood: string): boolean;
//# sourceMappingURL=chapter-cadence.d.ts.map