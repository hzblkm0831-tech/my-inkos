import type { HookPayoffTiming } from "../models/runtime-state.js";
import { type HookPhase } from "./hook-policy.js";
export declare function normalizeHookPayoffTiming(value: string | undefined | null): HookPayoffTiming | undefined;
export declare function inferHookPayoffTiming(params: {
    readonly expectedPayoff?: string;
    readonly notes?: string;
}): HookPayoffTiming;
export declare function resolveHookPayoffTiming(params: {
    readonly payoffTiming?: string | null;
    readonly expectedPayoff?: string;
    readonly notes?: string;
}): HookPayoffTiming;
export declare function localizeHookPayoffTiming(timing: HookPayoffTiming, language: "zh" | "en"): string;
export declare function describeHookLifecycle(params: {
    readonly payoffTiming?: string | null;
    readonly expectedPayoff?: string;
    readonly notes?: string;
    readonly startChapter: number;
    readonly lastAdvancedChapter: number;
    readonly status: string;
    readonly chapterNumber: number;
    readonly targetChapters?: number;
}): {
    readonly timing: HookPayoffTiming;
    readonly phase: HookPhase;
    readonly age: number;
    readonly dormancy: number;
    readonly readyToResolve: boolean;
    readonly stale: boolean;
    readonly overdue: boolean;
    readonly advancePressure: number;
    readonly resolvePressure: number;
};
//# sourceMappingURL=hook-lifecycle.d.ts.map