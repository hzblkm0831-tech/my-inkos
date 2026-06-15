import type { AuditIssue } from "../agents/continuity.js";
import type { HookRecord, RuntimeStateDelta } from "../models/runtime-state.js";
export declare function analyzeHookHealth(params: {
    readonly language: "zh" | "en";
    readonly chapterNumber: number;
    readonly targetChapters?: number;
    readonly hooks: ReadonlyArray<HookRecord>;
    readonly delta?: Pick<RuntimeStateDelta, "chapter" | "hookOps">;
    readonly existingHookIds?: ReadonlyArray<string>;
    readonly maxActiveHooks?: number;
    readonly staleAfterChapters?: number;
    readonly noAdvanceWindow?: number;
    readonly newHookBurstThreshold?: number;
}): AuditIssue[];
//# sourceMappingURL=hook-health.d.ts.map