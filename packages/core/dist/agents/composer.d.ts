import { BaseAgent } from "./base.js";
import type { BookConfig } from "../models/book.js";
import { type ChapterTrace, type ContextPackage, type RuleStack } from "../models/input-governance.js";
import type { PlanChapterOutput } from "./planner.js";
export interface ComposeChapterInput {
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly plan: PlanChapterOutput;
}
export interface ComposeChapterOutput {
    readonly contextPackage: ContextPackage;
    readonly ruleStack: RuleStack;
    readonly trace: ChapterTrace;
    readonly contextPath: string;
    readonly ruleStackPath: string;
    readonly tracePath: string;
}
export declare class ComposerAgent extends BaseAgent {
    get name(): string;
    composeChapter(input: ComposeChapterInput): Promise<ComposeChapterOutput>;
    private collectSelectedContext;
    private buildRecentChapterTrailEntries;
    private buildRecentEndingTrail;
    private extractLastMeaningfulSentence;
    private buildHookDebtEntries;
    private maybeContextSource;
    private pickExcerpt;
    private toFactAnchor;
    private readFileOrDefault;
    private describeHookAgendaRole;
    private findHookSummary;
    private summaryMentionsHook;
    private renderHookDebtBeat;
}
//# sourceMappingURL=composer.d.ts.map