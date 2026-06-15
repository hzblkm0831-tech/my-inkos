import { type Fact, type StoredHook, type StoredSummary } from "../state/memory-db.js";
export { buildPlannerHookAgenda, isFuturePlannedHook, isHookWithinChapterWindow, } from "./hook-agenda.js";
export { parseChapterSummariesMarkdown, parseCurrentStateFacts, parsePendingHooksMarkdown, renderHookSnapshot, renderSummarySnapshot, } from "./story-markdown.js";
export interface MemorySelection {
    readonly summaries: ReadonlyArray<StoredSummary>;
    readonly hooks: ReadonlyArray<StoredHook>;
    readonly activeHooks: ReadonlyArray<StoredHook>;
    readonly facts: ReadonlyArray<Fact>;
    readonly volumeSummaries: ReadonlyArray<VolumeSummarySelection>;
    readonly dbPath?: string;
}
export interface VolumeSummarySelection {
    readonly heading: string;
    readonly content: string;
    readonly anchor: string;
}
export declare function retrieveMemorySelection(params: {
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly goal: string;
    readonly outlineNode?: string;
    readonly mustKeep?: ReadonlyArray<string>;
}): Promise<MemorySelection>;
export declare function extractQueryTerms(goal: string, outlineNode: string | undefined, mustKeep: ReadonlyArray<string>): string[];
//# sourceMappingURL=memory-retrieval.d.ts.map