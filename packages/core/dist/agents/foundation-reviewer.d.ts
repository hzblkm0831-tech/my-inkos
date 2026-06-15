import { BaseAgent } from "./base.js";
import type { ArchitectOutput } from "./architect.js";
export interface FoundationReviewResult {
    readonly passed: boolean;
    readonly totalScore: number;
    readonly dimensions: ReadonlyArray<{
        readonly name: string;
        readonly score: number;
        readonly feedback: string;
    }>;
    readonly overallFeedback: string;
}
export declare class FoundationReviewerAgent extends BaseAgent {
    get name(): string;
    review(params: {
        readonly foundation: ArchitectOutput;
        readonly mode: "original" | "fanfic" | "series";
        readonly sourceCanon?: string;
        readonly styleGuide?: string;
        readonly language: "zh" | "en";
    }): Promise<FoundationReviewResult>;
    private originalDimensions;
    private derivativeDimensions;
    private buildChineseReviewPrompt;
    private buildEnglishReviewPrompt;
    private buildFoundationExcerpt;
    private parseReviewResult;
}
//# sourceMappingURL=foundation-reviewer.d.ts.map