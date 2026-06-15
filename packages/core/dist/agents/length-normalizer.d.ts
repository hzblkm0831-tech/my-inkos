import { BaseAgent } from "./base.js";
import type { LengthNormalizeMode, LengthSpec } from "../models/length-governance.js";
export interface NormalizeLengthInput {
    readonly chapterContent: string;
    readonly lengthSpec: LengthSpec;
    readonly chapterIntent?: string;
    readonly reducedControlBlock?: string;
}
export interface NormalizeLengthOutput {
    readonly normalizedContent: string;
    readonly finalCount: number;
    readonly applied: boolean;
    readonly mode: LengthNormalizeMode;
    readonly warning?: string;
    readonly tokenUsage?: {
        readonly promptTokens: number;
        readonly completionTokens: number;
        readonly totalTokens: number;
    };
}
export declare class LengthNormalizerAgent extends BaseAgent {
    get name(): string;
    normalizeChapter(input: NormalizeLengthInput): Promise<NormalizeLengthOutput>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private buildWarning;
    private sanitizeNormalizedContent;
    private extractFirstFencedBlock;
    private stripCommonWrappers;
    private isWrapperLine;
}
//# sourceMappingURL=length-normalizer.d.ts.map