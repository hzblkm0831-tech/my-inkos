/**
 * Temporal memory database for InkOS truth files.
 *
 * Uses Node.js built-in SQLite (node:sqlite, Node 22+).
 * Stores facts with temporal validity (valid_from/valid_until chapter numbers),
 * enabling precise queries like "what did character X know in chapter 5?"
 *
 * Backward compatible: existing markdown truth files are still the primary
 * persistence layer. MemoryDB is an acceleration index built alongside them.
 */
export interface Fact {
    readonly id?: number;
    readonly subject: string;
    readonly predicate: string;
    readonly object: string;
    readonly validFromChapter: number;
    readonly validUntilChapter: number | null;
    readonly sourceChapter: number;
}
export interface StoredSummary {
    readonly chapter: number;
    readonly title: string;
    readonly characters: string;
    readonly events: string;
    readonly stateChanges: string;
    readonly hookActivity: string;
    readonly mood: string;
    readonly chapterType: string;
}
export interface StoredHook {
    readonly hookId: string;
    readonly startChapter: number;
    readonly type: string;
    readonly status: string;
    readonly lastAdvancedChapter: number;
    readonly expectedPayoff: string;
    readonly payoffTiming?: string;
    readonly notes: string;
}
export declare class MemoryDB {
    private db;
    constructor(bookDir: string);
    private migrate;
    private ensureColumn;
    /** Add a new fact. */
    addFact(fact: Omit<Fact, "id">): number;
    /** Invalidate a fact (set valid_until). */
    invalidateFact(id: number, untilChapter: number): void;
    /** Get all currently valid facts (valid_until is null). */
    getCurrentFacts(): ReadonlyArray<Fact>;
    /** Get facts about a specific subject that are valid at a given chapter. */
    getFactsAt(subject: string, chapter: number): ReadonlyArray<Fact>;
    /** Get all facts about a subject (including historical). */
    getFactHistory(subject: string): ReadonlyArray<Fact>;
    /** Search facts by predicate (e.g., all "location" facts). */
    getFactsByPredicate(predicate: string): ReadonlyArray<Fact>;
    /** Get facts relevant to a set of character names. */
    getFactsForCharacters(names: ReadonlyArray<string>): ReadonlyArray<Fact>;
    replaceCurrentFacts(facts: ReadonlyArray<Omit<Fact, "id">>): void;
    resetFacts(): void;
    /** Upsert a chapter summary. */
    upsertSummary(summary: StoredSummary): void;
    replaceSummaries(summaries: ReadonlyArray<StoredSummary>): void;
    /** Get summaries for a range of chapters. */
    getSummaries(fromChapter: number, toChapter: number): ReadonlyArray<StoredSummary>;
    /** Get summaries matching any of the given character names. */
    getSummariesByCharacters(names: ReadonlyArray<string>): ReadonlyArray<StoredSummary>;
    /** Get total chapter count. */
    getChapterCount(): number;
    /** Get the most recent N summaries. */
    getRecentSummaries(count: number): ReadonlyArray<StoredSummary>;
    upsertHook(hook: StoredHook): void;
    replaceHooks(hooks: ReadonlyArray<StoredHook>): void;
    getActiveHooks(): ReadonlyArray<StoredHook>;
    close(): void;
}
//# sourceMappingURL=memory-db.d.ts.map