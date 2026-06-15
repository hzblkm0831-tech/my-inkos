import type { Fact, StoredHook, StoredSummary } from "../state/memory-db.js";
export declare function renderSummarySnapshot(summaries: ReadonlyArray<StoredSummary>, language?: "zh" | "en"): string;
export declare function renderHookSnapshot(hooks: ReadonlyArray<StoredHook>, language?: "zh" | "en"): string;
export declare function parseChapterSummariesMarkdown(markdown: string): StoredSummary[];
export declare function parsePendingHooksMarkdown(markdown: string): StoredHook[];
export declare function parseCurrentStateFacts(markdown: string, fallbackChapter: number): Fact[];
export declare function parseMarkdownTableRows(markdown: string): string[][];
export declare function isStateTableHeaderRow(row: ReadonlyArray<string>): boolean;
export declare function isCurrentChapterLabel(label: string): boolean;
export declare function inferFactSubject(label: string): string;
export declare function parseInteger(value: string | undefined): number;
export declare function normalizeHookId(value: string | undefined): string;
//# sourceMappingURL=story-markdown.d.ts.map