import { BaseAgent } from "./base.js";
export interface ValidationWarning {
    readonly category: string;
    readonly description: string;
}
export interface ValidationResult {
    readonly warnings: ReadonlyArray<ValidationWarning>;
    readonly passed: boolean;
}
/**
 * Validates Settler output by comparing old and new truth files via LLM.
 * Catches contradictions, missing state changes, and temporal inconsistencies.
 *
 * Uses a minimal verdict protocol instead of requiring structured JSON:
 *   Line 1: PASS or FAIL
 *   Remaining lines: free-form warnings (one per line, optional category prefix)
 */
export declare class StateValidatorAgent extends BaseAgent {
    get name(): string;
    validate(chapterContent: string, chapterNumber: number, oldState: string, newState: string, oldHooks: string, newHooks: string, language?: "zh" | "en"): Promise<ValidationResult>;
    private computeDiff;
    private parseResult;
    private tryParseJsonResult;
    private tryParseExactJsonResult;
}
//# sourceMappingURL=state-validator.d.ts.map