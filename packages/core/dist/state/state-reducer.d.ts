import { type ChapterSummariesState, type CurrentStateState, type HooksState, type RuntimeStateDelta, type StateManifest } from "../models/runtime-state.js";
export interface RuntimeStateSnapshot {
    readonly manifest: StateManifest;
    readonly currentState: CurrentStateState;
    readonly hooks: HooksState;
    readonly chapterSummaries: ChapterSummariesState;
}
export declare function applyRuntimeStateDelta(params: {
    readonly snapshot: RuntimeStateSnapshot;
    readonly delta: RuntimeStateDelta;
    readonly allowReapply?: boolean;
}): RuntimeStateSnapshot;
//# sourceMappingURL=state-reducer.d.ts.map