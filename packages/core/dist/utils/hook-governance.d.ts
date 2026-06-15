import type { HookRecord, RuntimeStateDelta } from "../models/runtime-state.js";
export type HookDisposition = "none" | "mention" | "advance" | "resolve" | "defer";
export interface HookAdmissionCandidate {
    readonly type: string;
    readonly expectedPayoff?: string;
    readonly payoffTiming?: string;
    readonly notes?: string;
}
export interface HookAdmissionDecision {
    readonly admit: boolean;
    readonly reason: "admit" | "missing_type" | "missing_payoff_signal" | "duplicate_family";
    readonly matchedHookId?: string;
}
export declare function collectStaleHookDebt(params: {
    readonly hooks: ReadonlyArray<HookRecord>;
    readonly chapterNumber: number;
    readonly targetChapters?: number;
    readonly staleAfterChapters?: number;
}): HookRecord[];
export declare function evaluateHookAdmission(params: {
    readonly candidate: HookAdmissionCandidate;
    readonly activeHooks: ReadonlyArray<HookRecord>;
}): HookAdmissionDecision;
export declare function classifyHookDisposition(params: {
    readonly hookId: string;
    readonly delta: Pick<RuntimeStateDelta, "chapter" | "hookOps">;
}): HookDisposition;
//# sourceMappingURL=hook-governance.d.ts.map