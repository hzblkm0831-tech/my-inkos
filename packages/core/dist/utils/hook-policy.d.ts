import type { HookPayoffTiming } from "../models/runtime-state.js";
export type HookPhase = "opening" | "middle" | "late";
export type HookAgendaLoad = "light" | "medium" | "heavy";
export interface HookLifecycleProfile {
    readonly earliestResolveAge: number;
    readonly staleDormancy: number;
    readonly overdueAge: number;
    readonly minimumPhase: HookPhase;
    readonly resolveBias: number;
}
export declare const HOOK_TIMING_PROFILES: Record<HookPayoffTiming, HookLifecycleProfile>;
export declare const HOOK_PHASE_WEIGHT: Record<HookPhase, number>;
export declare const HOOK_PHASE_THRESHOLDS: {
    readonly middleProgress: 0.33;
    readonly lateProgress: 0.72;
    readonly middleChapter: 8;
    readonly lateChapter: 24;
};
export declare const HOOK_PRESSURE_WEIGHTS: {
    readonly staleAdvanceBonus: 8;
    readonly overdueAdvanceBonus: 6;
    readonly resolveBiasMultiplier: 10;
    readonly progressingResolveBonus: 5;
    readonly dormancyResolveMultiplier: 2;
    readonly maxDormancyResolveBonus: 12;
    readonly overdueResolveBonus: 10;
    readonly mustAdvancePressureFloor: 8;
    readonly criticalResolvePressure: 40;
};
export declare const HOOK_ACTIVITY_THRESHOLDS: {
    readonly recentlyTouchedDormancy: 1;
    readonly longArcQuietHoldMaxAge: 2;
    readonly longArcQuietHoldMaxDormancy: 1;
    readonly refreshDormancy: 2;
    readonly freshPromiseAge: 1;
};
export declare const HOOK_AGENDA_LIMITS: Record<HookAgendaLoad, {
    readonly staleDebt: number;
    readonly mustAdvance: number;
    readonly eligibleResolve: number;
    readonly avoidFamilies: number;
}>;
export declare const HOOK_AGENDA_LOAD_THRESHOLDS: {
    readonly heavyReadyCount: 3;
    readonly heavyStaleCount: 4;
    readonly heavyCriticalCount: 3;
    readonly heavyPressuredCount: 6;
    readonly mediumReadyCount: 2;
    readonly mediumStaleCount: 2;
    readonly mediumCriticalCount: 1;
    readonly mediumPressuredFamilies: 3;
};
export declare const HOOK_VISIBILITY_WINDOWS: Record<HookPayoffTiming, number>;
export declare const HOOK_RELEVANT_SELECTION_DEFAULTS: {
    readonly primary: {
        readonly baseLimit: 3;
        readonly pressuredExpansionLimit: 4;
        readonly pressuredThreshold: 4;
    };
    readonly stale: {
        readonly defaultLimit: 1;
        readonly expandedLimit: 2;
        readonly overdueThreshold: 2;
        readonly familySpreadThreshold: 2;
    };
};
export declare const HOOK_HEALTH_DEFAULTS: {
    readonly maxActiveHooks: 12;
    readonly staleAfterChapters: 10;
    readonly noAdvanceWindow: 5;
    readonly newHookBurstThreshold: 2;
};
export declare function resolveHookVisibilityWindow(timing: HookPayoffTiming): number;
//# sourceMappingURL=hook-policy.d.ts.map