import type { AuditIssue } from "../agents/continuity.js";
import type { ValidationResult, ValidationWarning } from "../agents/state-validator.js";
import type { StateValidatorAgent } from "../agents/state-validator.js";
import type { WriteChapterOutput } from "../agents/writer.js";
import type { WriterAgent } from "../agents/writer.js";
import type { Logger } from "../utils/logger.js";
import type { BookConfig } from "../models/book.js";
import type { ChapterMeta } from "../models/chapter.js";
import type { ContextPackage, RuleStack } from "../models/input-governance.js";
import type { LengthLanguage } from "../utils/length-metrics.js";
export interface SettlementRetryParams {
    readonly writer: Pick<WriterAgent, "settleChapterState">;
    readonly validator: Pick<StateValidatorAgent, "validate">;
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly reducedControlInput?: {
        chapterIntent: string;
        contextPackage: ContextPackage;
        ruleStack: RuleStack;
    };
    readonly oldState: string;
    readonly oldHooks: string;
    readonly originalValidation: ValidationResult;
    readonly language: LengthLanguage;
    readonly logWarn?: (message: {
        zh: string;
        en: string;
    }) => void;
    readonly logger?: Pick<Logger, "warn">;
}
export type SettlementRetryResult = {
    readonly kind: "recovered";
    readonly output: WriteChapterOutput;
    readonly validation: ValidationResult;
} | {
    readonly kind: "degraded";
    readonly issues: ReadonlyArray<AuditIssue>;
};
export declare function retrySettlementAfterValidationFailure(params: SettlementRetryParams): Promise<SettlementRetryResult>;
export declare function buildStateValidationFeedback(warnings: ReadonlyArray<ValidationWarning>, language: LengthLanguage): string;
export declare function buildStateDegradedIssues(warnings: ReadonlyArray<ValidationWarning>, language: LengthLanguage): ReadonlyArray<AuditIssue>;
export declare function buildStateDegradedPersistenceOutput(params: {
    readonly output: WriteChapterOutput;
    readonly oldState: string;
    readonly oldHooks: string;
    readonly oldLedger: string;
}): WriteChapterOutput;
export interface StateDegradedReviewNote {
    readonly kind: "state-degraded";
    readonly baseStatus: "ready-for-review" | "audit-failed";
    readonly injectedIssues: ReadonlyArray<string>;
}
export declare function buildStateDegradedReviewNote(baseStatus: "ready-for-review" | "audit-failed", issues: ReadonlyArray<AuditIssue>): string;
export declare function parseStateDegradedReviewNote(reviewNote?: string): StateDegradedReviewNote | null;
export declare function resolveStateDegradedBaseStatus(chapter: Pick<ChapterMeta, "reviewNote" | "auditIssues">): "ready-for-review" | "audit-failed";
//# sourceMappingURL=chapter-state-recovery.d.ts.map