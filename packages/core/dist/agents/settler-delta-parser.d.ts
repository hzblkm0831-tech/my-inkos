import { type RuntimeStateDelta } from "../models/runtime-state.js";
export interface SettlerDeltaOutput {
    readonly postSettlement: string;
    readonly runtimeStateDelta: RuntimeStateDelta;
}
export declare function parseSettlerDeltaOutput(content: string): SettlerDeltaOutput;
//# sourceMappingURL=settler-delta-parser.d.ts.map