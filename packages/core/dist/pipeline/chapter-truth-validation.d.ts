import type { AuditIssue, AuditResult } from "../agents/continuity.js";
import type { ValidationResult, StateValidatorAgent } from "../agents/state-validator.js";
import type { WriteChapterOutput, WriterAgent } from "../agents/writer.js";
import type { BookConfig } from "../models/book.js";
import type { ContextPackage, RuleStack } from "../models/input-governance.js";
import type { Logger } from "../utils/logger.js";
import type { LengthLanguage } from "../utils/length-metrics.js";
export declare function validateChapterTruthPersistence(params: {
    readonly writer: Pick<WriterAgent, "settleChapterState">;
    readonly validator: Pick<StateValidatorAgent, "validate">;
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly persistenceOutput: WriteChapterOutput;
    readonly auditResult: AuditResult;
    readonly previousTruth: {
        readonly oldState: string;
        readonly oldHooks: string;
        readonly oldLedger: string;
    };
    readonly reducedControlInput?: {
        chapterIntent: string;
        contextPackage: ContextPackage;
        ruleStack: RuleStack;
    };
    readonly language: LengthLanguage;
    readonly logWarn: (message: {
        zh: string;
        en: string;
    }) => void;
    readonly logger?: Pick<Logger, "warn">;
}): Promise<{
    readonly validation: ValidationResult;
    readonly chapterStatus: "state-degraded" | null;
    readonly degradedIssues: ReadonlyArray<AuditIssue>;
    readonly persistenceOutput: WriteChapterOutput;
    readonly auditResult: AuditResult;
}>;
//# sourceMappingURL=chapter-truth-validation.d.ts.map