import { BaseAgent } from "./base.js";
import type { BookConfig } from "../models/book.js";
import { type PostWriteViolation } from "./post-write-validator.js";
import type { ChapterTrace, ContextPackage, RuleStack } from "../models/input-governance.js";
import type { LengthSpec } from "../models/length-governance.js";
import type { RuntimeStateDelta } from "../models/runtime-state.js";
import type { RuntimeStateSnapshot } from "../state/state-reducer.js";
export interface WriteChapterInput {
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly externalContext?: string;
    readonly chapterIntent?: string;
    readonly contextPackage?: ContextPackage;
    readonly ruleStack?: RuleStack;
    readonly trace?: ChapterTrace;
    readonly lengthSpec?: LengthSpec;
    readonly wordCountOverride?: number;
    readonly temperatureOverride?: number;
}
export interface SettleChapterStateInput {
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly allowReapply?: boolean;
    readonly chapterIntent?: string;
    readonly contextPackage?: ContextPackage;
    readonly ruleStack?: RuleStack;
    readonly validationFeedback?: string;
}
export interface TokenUsage {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
}
export interface WriteChapterOutput {
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly wordCount: number;
    readonly preWriteCheck: string;
    readonly postSettlement: string;
    readonly runtimeStateDelta?: RuntimeStateDelta;
    readonly runtimeStateSnapshot?: RuntimeStateSnapshot;
    readonly updatedState: string;
    readonly updatedLedger: string;
    readonly updatedHooks: string;
    readonly chapterSummary: string;
    readonly updatedChapterSummaries?: string;
    readonly updatedSubplots: string;
    readonly updatedEmotionalArcs: string;
    readonly updatedCharacterMatrix: string;
    readonly postWriteErrors: ReadonlyArray<PostWriteViolation>;
    readonly postWriteWarnings: ReadonlyArray<PostWriteViolation>;
    readonly hookHealthIssues?: ReadonlyArray<{
        readonly severity: "critical" | "warning" | "info";
        readonly category: string;
        readonly description: string;
        readonly suggestion: string;
    }>;
    readonly tokenUsage?: TokenUsage;
}
export declare class WriterAgent extends BaseAgent {
    get name(): string;
    private localize;
    private logInfo;
    private logWarn;
    writeChapter(input: WriteChapterInput): Promise<WriteChapterOutput>;
    settleChapterState(input: SettleChapterStateInput): Promise<WriteChapterOutput>;
    private settle;
    saveChapter(bookDir: string, output: WriteChapterOutput, numericalSystem?: boolean, language?: "zh" | "en"): Promise<void>;
    private buildUserPrompt;
    private buildGovernedUserPrompt;
    private joinGovernedEvidenceBlocks;
    private extractMarkdownSection;
    private buildSettlerGovernedControlBlock;
    private buildLengthRequirementBlock;
    private loadRecentChapters;
    private readFileOrDefault;
    /** Save new truth files (summaries, subplots, emotional arcs, character matrix). */
    saveNewTruthFiles(bookDir: string, output: WriteChapterOutput, language?: "zh" | "en"): Promise<void>;
    private renderDeltaSummaryRow;
    private normalizeRuntimeStateDeltaChapter;
    private buildRuntimeStateArtifactsIfPresent;
    private resolveRuntimeStateArtifactsForOutput;
    private appendChapterSummary;
    private buildStyleFingerprint;
    /**
     * Extract dialogue fingerprints from recent chapters.
     * For each character with multiple dialogue lines, compute speaking style markers.
     */
    private extractDialogueFingerprints;
    /**
     * Find relevant chapter summaries based on volume outline context.
     * Extracts character names and hook IDs from the current volume's outline,
     * then searches chapter summaries for matching entries.
     */
    private findRelevantSummaries;
    private sanitizeFilename;
}
//# sourceMappingURL=writer.d.ts.map