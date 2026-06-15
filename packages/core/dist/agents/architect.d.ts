import { BaseAgent } from "./base.js";
import type { BookConfig, FanficMode } from "../models/book.js";
export interface ArchitectOutput {
    readonly storyBible: string;
    readonly volumeOutline: string;
    readonly bookRules: string;
    readonly currentState: string;
    readonly pendingHooks: string;
}
export declare class ArchitectAgent extends BaseAgent {
    get name(): string;
    generateFoundation(book: BookConfig, externalContext?: string, reviewFeedback?: string): Promise<ArchitectOutput>;
    writeFoundationFiles(bookDir: string, output: ArchitectOutput, numericalSystem?: boolean, language?: "zh" | "en"): Promise<void>;
    /**
     * Reverse-engineer foundation from existing chapters.
     * Reads all chapters as a single text block and asks LLM to extract story_bible,
     * volume_outline, book_rules, current_state, and pending_hooks.
     */
    generateFoundationFromImport(book: BookConfig, chaptersText: string, externalContext?: string, reviewFeedback?: string, options?: {
        readonly importMode?: "continuation" | "series";
    }): Promise<ArchitectOutput>;
    generateFanficFoundation(book: BookConfig, fanficCanon: string, fanficMode: FanficMode, reviewFeedback?: string): Promise<ArchitectOutput>;
    private buildReviewFeedbackBlock;
    private parseSections;
    private normalizeSectionName;
    private stripTrailingAssistantCoda;
    private normalizePendingHooksSection;
    private parseHookChapterNumber;
    private hasNarrativeProgress;
    private mergeHookNotes;
}
//# sourceMappingURL=architect.d.ts.map