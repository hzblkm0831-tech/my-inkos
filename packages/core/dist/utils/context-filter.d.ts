/**
 * Smart context filtering for Writer and Auditor prompts.
 *
 * Reduces noise by injecting only relevant parts of truth files.
 * Every filter falls back to the full input if filtering would empty it.
 */
/** Filter pending_hooks: remove resolved/closed hooks. */
export declare function filterHooks(hooks: string): string;
/** Filter chapter_summaries: keep only the most recent N chapters. */
export declare function filterSummaries(summaries: string, currentChapter: number, keepRecent?: 4): string;
/** Filter subplot_board: remove closed/resolved subplots. */
export declare function filterSubplots(board: string): string;
/** Filter emotional_arcs: keep only the most recent N chapters. */
export declare function filterEmotionalArcs(arcs: string, currentChapter: number, keepRecent?: 4): string;
/**
 * Filter character_matrix: keep only characters mentioned in the volume outline
 * current section + protagonist.
 */
export declare function filterCharacterMatrix(matrix: string, volumeOutline: string, protagonistName?: string): string;
//# sourceMappingURL=context-filter.d.ts.map