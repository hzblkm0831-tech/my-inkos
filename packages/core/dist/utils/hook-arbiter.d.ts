import { type HookRecord, type NewHookCandidate, type RuntimeStateDelta } from "../models/runtime-state.js";
export interface HookArbiterDecision {
    readonly action: "created" | "mapped" | "mentioned" | "rejected";
    readonly reason: string;
    readonly hookId?: string;
    readonly candidate: NewHookCandidate;
}
export declare function arbitrateRuntimeStateDeltaHooks(params: {
    readonly hooks: ReadonlyArray<HookRecord>;
    readonly delta: RuntimeStateDelta;
}): {
    readonly resolvedDelta: RuntimeStateDelta;
    readonly decisions: ReadonlyArray<HookArbiterDecision>;
};
//# sourceMappingURL=hook-arbiter.d.ts.map