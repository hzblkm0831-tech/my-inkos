import type { AuditIssue, AuditResult } from "../agents/continuity.js";
import type { ReviseOutput } from "../agents/reviser.js";
import type { WriteChapterOutput } from "../agents/writer.js";
import type { ContextPackage, RuleStack } from "../models/input-governance.js";
import type { LengthSpec } from "../models/length-governance.js";
export interface ChapterReviewCycleUsage {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
}
export interface ChapterReviewCycleControlInput {
    readonly chapterIntent: string;
    readonly contextPackage: ContextPackage;
    readonly ruleStack: RuleStack;
}
export interface ChapterReviewCycleResult {
    readonly finalContent: string;
    readonly finalWordCount: number;
    readonly preAuditNormalizedWordCount: number;
    readonly revised: boolean;
    readonly auditResult: AuditResult;
    readonly totalUsage: ChapterReviewCycleUsage;
    readonly postReviseCount: number;
    readonly normalizeApplied: boolean;
}
export declare function runChapterReviewCycle(params: {
    readonly book: Pick<{
        genre: string;
    }, "genre">;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly initialOutput: Pick<WriteChapterOutput, "content" | "wordCount" | "postWriteErrors">;
    readonly reducedControlInput?: ChapterReviewCycleControlInput;
    readonly lengthSpec: LengthSpec;
    readonly initialUsage: ChapterReviewCycleUsage;
    readonly createReviser: () => {
        reviseChapter: (bookDir: string, chapterContent: string, chapterNumber: number, issues: ReadonlyArray<AuditIssue>, mode: "spot-fix", genre?: string, options?: {
            chapterIntent?: string;
            contextPackage?: ContextPackage;
            ruleStack?: RuleStack;
            lengthSpec?: LengthSpec;
        }) => Promise<ReviseOutput>;
    };
    readonly auditor: {
        auditChapter: (bookDir: string, chapterContent: string, chapterNumber: number, genre?: string, options?: {
            temperature?: number;
            chapterIntent?: string;
            contextPackage?: ContextPackage;
            ruleStack?: RuleStack;
        }) => Promise<AuditResult>;
    };
    readonly normalizeDraftLengthIfNeeded: (chapterContent: string) => Promise<{
        content: string;
        wordCount: number;
        applied: boolean;
        tokenUsage?: ChapterReviewCycleUsage;
    }>;
    readonly assertChapterContentNotEmpty: (content: string, stage: string) => void;
    readonly addUsage: (left: ChapterReviewCycleUsage, right?: ChapterReviewCycleUsage) => ChapterReviewCycleUsage;
    readonly restoreLostAuditIssues: (previous: AuditResult, next: AuditResult) => AuditResult;
    readonly analyzeAITells: (content: string) => {
        issues: ReadonlyArray<AuditIssue>;
    };
    readonly analyzeSensitiveWords: (content: string) => {
        found: ReadonlyArray<{
            severity: string;
        }>;
        issues: ReadonlyArray<AuditIssue>;
    };
    readonly logWarn: (message: {
        zh: string;
        en: string;
    }) => void;
    readonly logStage: (message: {
        zh: string;
        en: string;
    }) => void;
}): Promise<ChapterReviewCycleResult>;
//# sourceMappingURL=chapter-review-cycle.d.ts.map