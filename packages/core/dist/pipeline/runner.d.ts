import type { LLMClient, OnStreamProgress } from "../llm/provider.js";
import type { Logger } from "../utils/logger.js";
import type { BookConfig, FanficMode } from "../models/book.js";
import type { ChapterMeta } from "../models/chapter.js";
import type { NotifyChannel, LLMConfig, AgentLLMOverride, InputGovernanceMode } from "../models/project.js";
import { type ReviseMode } from "../agents/reviser.js";
import type { RadarSource } from "../agents/radar-source.js";
import type { AuditResult } from "../agents/continuity.js";
import type { RadarResult } from "../agents/radar.js";
import type { LengthTelemetry } from "../models/length-governance.js";
export interface PipelineConfig {
    readonly client: LLMClient;
    readonly model: string;
    readonly projectRoot: string;
    readonly defaultLLMConfig?: LLMConfig;
    readonly notifyChannels?: ReadonlyArray<NotifyChannel>;
    readonly radarSources?: ReadonlyArray<RadarSource>;
    readonly externalContext?: string;
    readonly modelOverrides?: Record<string, string | AgentLLMOverride>;
    readonly inputGovernanceMode?: InputGovernanceMode;
    readonly logger?: Logger;
    readonly onStreamProgress?: OnStreamProgress;
}
export interface TokenUsageSummary {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
}
export interface ChapterPipelineResult {
    readonly chapterNumber: number;
    readonly title: string;
    readonly wordCount: number;
    readonly auditResult: AuditResult;
    readonly revised: boolean;
    readonly status: "ready-for-review" | "audit-failed" | "state-degraded";
    readonly lengthWarnings?: ReadonlyArray<string>;
    readonly lengthTelemetry?: LengthTelemetry;
    readonly tokenUsage?: TokenUsageSummary;
}
export interface DraftResult {
    readonly chapterNumber: number;
    readonly title: string;
    readonly wordCount: number;
    readonly filePath: string;
    readonly lengthWarnings?: ReadonlyArray<string>;
    readonly lengthTelemetry?: LengthTelemetry;
    readonly tokenUsage?: TokenUsageSummary;
}
export interface PlanChapterResult {
    readonly bookId: string;
    readonly chapterNumber: number;
    readonly intentPath: string;
    readonly goal: string;
    readonly conflicts: ReadonlyArray<string>;
}
export interface ComposeChapterResult extends PlanChapterResult {
    readonly contextPath: string;
    readonly ruleStackPath: string;
    readonly tracePath: string;
}
export interface ReviseResult {
    readonly chapterNumber: number;
    readonly wordCount: number;
    readonly fixedIssues: ReadonlyArray<string>;
    readonly applied: boolean;
    readonly status: "unchanged" | "ready-for-review" | "audit-failed";
    readonly skippedReason?: string;
    readonly lengthWarnings?: ReadonlyArray<string>;
    readonly lengthTelemetry?: LengthTelemetry;
}
export interface TruthFiles {
    readonly currentState: string;
    readonly particleLedger: string;
    readonly pendingHooks: string;
    readonly storyBible: string;
    readonly volumeOutline: string;
    readonly bookRules: string;
}
export interface BookStatusInfo {
    readonly bookId: string;
    readonly title: string;
    readonly genre: string;
    readonly platform: string;
    readonly status: string;
    readonly chaptersWritten: number;
    readonly totalWords: number;
    readonly nextChapter: number;
    readonly chapters: ReadonlyArray<ChapterMeta>;
}
export interface ImportChaptersInput {
    readonly bookId: string;
    readonly chapters: ReadonlyArray<{
        readonly title: string;
        readonly content: string;
    }>;
    readonly resumeFrom?: number;
    /** "continuation" (default) = pick up where the text left off, no new spacetime.
     *  "series" = shared universe but independent new story, requires new spacetime. */
    readonly importMode?: "continuation" | "series";
}
export interface ImportChaptersResult {
    readonly bookId: string;
    readonly importedCount: number;
    readonly totalWords: number;
    readonly nextChapter: number;
}
export interface InitBookOptions {
    readonly externalContext?: string;
    readonly authorIntent?: string;
    readonly currentFocus?: string;
}
export declare class PipelineRunner {
    private readonly state;
    private readonly config;
    private readonly agentClients;
    private memoryIndexFallbackWarned;
    constructor(config: PipelineConfig);
    private localize;
    private resolveBookLanguage;
    private resolveBookLanguageById;
    private languageFromLengthSpec;
    private logStage;
    private logInfo;
    private logWarn;
    private tryGenerateStyleGuide;
    private generateAndReviewFoundation;
    private buildFoundationReviewFeedback;
    private agentCtx;
    private resolveOverride;
    private agentCtxFor;
    private pathExists;
    private loadGenreProfile;
    runRadar(): Promise<RadarResult>;
    initBook(book: BookConfig, options?: InitBookOptions): Promise<void>;
    /** Import external source material and generate fanfic_canon.md */
    importFanficCanon(bookId: string, sourceText: string, sourceName: string, fanficMode: FanficMode): Promise<string>;
    /** One-step fanfic book creation: create book + import canon + generate foundation */
    initFanficBook(book: BookConfig, sourceText: string, sourceName: string, fanficMode: FanficMode): Promise<void>;
    /** Write a single draft chapter. Saves chapter file + truth files + index + snapshot. */
    writeDraft(bookId: string, context?: string, wordCount?: number): Promise<DraftResult>;
    planChapter(bookId: string, context?: string): Promise<PlanChapterResult>;
    composeChapter(bookId: string, context?: string): Promise<ComposeChapterResult>;
    /** Audit the latest (or specified) chapter. Read-only, no lock needed. */
    auditDraft(bookId: string, chapterNumber?: number): Promise<AuditResult & {
        readonly chapterNumber: number;
    }>;
    /** Revise the latest (or specified) chapter based on audit issues. */
    reviseDraft(bookId: string, chapterNumber?: number, mode?: ReviseMode): Promise<ReviseResult>;
    /** Read all truth files for a book. */
    readTruthFiles(bookId: string): Promise<TruthFiles>;
    /** Get book status overview. */
    getBookStatus(bookId: string): Promise<BookStatusInfo>;
    writeNextChapter(bookId: string, wordCount?: number, temperatureOverride?: number): Promise<ChapterPipelineResult>;
    repairChapterState(bookId: string, chapterNumber?: number): Promise<ChapterPipelineResult>;
    resyncChapterArtifacts(bookId: string, chapterNumber?: number): Promise<ChapterPipelineResult>;
    private _writeNextChapterLocked;
    private _repairChapterStateLocked;
    private _resyncChapterArtifactsLocked;
    /**
     * Generate a qualitative style guide from reference text via LLM.
     * Also saves the statistical style_profile.json.
     */
    generateStyleGuide(bookId: string, referenceText: string, sourceName?: string): Promise<string>;
    /**
     * Import canon from parent book for spinoff writing.
     * Reads parent's truth files, uses LLM to generate parent_canon.md in target book.
     */
    importCanon(targetBookId: string, parentBookId: string): Promise<string>;
    private readParentChapterSample;
    /**
     * Import existing chapters into a book. Reverse-engineers all truth files
     * via sequential replay so the Writer and Auditor can continue naturally.
     *
     * Step 1: Generate foundation (story_bible, volume_outline, book_rules) from all chapters.
     * Step 2: Sequentially replay each chapter through ChapterAnalyzer to build truth files.
     */
    importChapters(input: ImportChaptersInput): Promise<ImportChaptersResult>;
    private static addUsage;
    private buildPersistenceOutput;
    private assertNoPendingStateRepair;
    private prepareWriteInput;
    private resetImportReplayTruthFiles;
    private buildImportReplayStateSeed;
    private buildImportReplayHooksSeed;
    private normalizeDraftLengthIfNeeded;
    private assertChapterContentNotEmpty;
    private syncCurrentStateFactHistory;
    private syncLegacyStructuredStateFromMarkdown;
    private syncNarrativeMemoryIndex;
    private rebuildCurrentStateFactHistory;
    private rebuildNarrativeMemoryIndex;
    private canOpenMemoryIndex;
    private logMemoryIndexDebugInfo;
    private withMemoryIndexRetry;
    private isMemoryIndexUnavailableError;
    private isMemoryIndexBusyError;
    private factKey;
    private buildLengthWarnings;
    private buildLengthTelemetry;
    private persistAuditDriftGuidance;
    private stripAuditDriftCorrectionBlock;
    private logLengthWarnings;
    private restoreLostAuditIssues;
    private restoreActionableAuditIfLost;
    private evaluateMergedAudit;
    private markBookActiveIfNeeded;
    private createGovernedArtifacts;
    private resolveGovernedPlan;
    private emitWebhook;
    private readChapterContent;
}
//# sourceMappingURL=runner.d.ts.map