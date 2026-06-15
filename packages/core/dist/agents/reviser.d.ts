import { BaseAgent } from "./base.js";
import type { LengthSpec } from "../models/length-governance.js";
import type { AuditIssue } from "./continuity.js";
import type { ContextPackage, RuleStack } from "../models/input-governance.js";
export type ReviseMode = "polish" | "rewrite" | "rework" | "anti-detect" | "spot-fix";
export declare const DEFAULT_REVISE_MODE: ReviseMode;
export interface ReviseOutput {
    readonly revisedContent: string;
    readonly wordCount: number;
    readonly fixedIssues: ReadonlyArray<string>;
    readonly updatedState: string;
    readonly updatedLedger: string;
    readonly updatedHooks: string;
    readonly tokenUsage?: {
        readonly promptTokens: number;
        readonly completionTokens: number;
        readonly totalTokens: number;
    };
}
export declare class ReviserAgent extends BaseAgent {
    get name(): string;
    reviseChapter(bookDir: string, chapterContent: string, chapterNumber: number, issues: ReadonlyArray<AuditIssue>, mode?: ReviseMode, genre?: string, options?: {
        chapterIntent?: string;
        contextPackage?: ContextPackage;
        ruleStack?: RuleStack;
        lengthSpec?: LengthSpec;
    }): Promise<ReviseOutput>;
    private parseOutput;
    private readFileSafe;
    private buildReducedControlBlock;
}
//# sourceMappingURL=reviser.d.ts.map