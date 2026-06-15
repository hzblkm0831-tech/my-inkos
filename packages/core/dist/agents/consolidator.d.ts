import { BaseAgent } from "./base.js";
export interface ConsolidationResult {
    readonly volumeSummaries: string;
    readonly archivedVolumes: number;
    readonly retainedChapters: number;
}
/**
 * Consolidates chapter summaries into volume-level narrative summaries.
 * Reduces token usage for long books while preserving critical context.
 */
export declare class ConsolidatorAgent extends BaseAgent {
    get name(): string;
    /**
     * Consolidate chapter summaries by volume.
     * - Reads volume_outline to determine volume boundaries
     * - For each completed volume, LLM compresses chapter summaries into a narrative paragraph
     * - Archives detailed summaries, keeps only recent volume's per-chapter rows
     */
    consolidate(bookDir: string): Promise<ConsolidationResult>;
    private parseVolumeBoundaries;
    private parseSummaryTable;
}
//# sourceMappingURL=consolidator.d.ts.map