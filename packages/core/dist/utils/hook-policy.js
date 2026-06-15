export const HOOK_TIMING_PROFILES = {
    immediate: {
        earliestResolveAge: 1,
        staleDormancy: 1,
        overdueAge: 3,
        minimumPhase: "opening",
        resolveBias: 5,
    },
    "near-term": {
        earliestResolveAge: 1,
        staleDormancy: 2,
        overdueAge: 5,
        minimumPhase: "opening",
        resolveBias: 4,
    },
    "mid-arc": {
        earliestResolveAge: 2,
        staleDormancy: 4,
        overdueAge: 8,
        minimumPhase: "opening",
        resolveBias: 3,
    },
    "slow-burn": {
        earliestResolveAge: 4,
        staleDormancy: 5,
        overdueAge: 12,
        minimumPhase: "middle",
        resolveBias: 2,
    },
    endgame: {
        earliestResolveAge: 6,
        staleDormancy: 6,
        overdueAge: 16,
        minimumPhase: "late",
        resolveBias: 1,
    },
};
export const HOOK_PHASE_WEIGHT = {
    opening: 0,
    middle: 1,
    late: 2,
};
export const HOOK_PHASE_THRESHOLDS = {
    middleProgress: 0.33,
    lateProgress: 0.72,
    middleChapter: 8,
    lateChapter: 24,
};
export const HOOK_PRESSURE_WEIGHTS = {
    staleAdvanceBonus: 8,
    overdueAdvanceBonus: 6,
    resolveBiasMultiplier: 10,
    progressingResolveBonus: 5,
    dormancyResolveMultiplier: 2,
    maxDormancyResolveBonus: 12,
    overdueResolveBonus: 10,
    mustAdvancePressureFloor: 8,
    criticalResolvePressure: 40,
};
export const HOOK_ACTIVITY_THRESHOLDS = {
    recentlyTouchedDormancy: 1,
    longArcQuietHoldMaxAge: 2,
    longArcQuietHoldMaxDormancy: 1,
    refreshDormancy: 2,
    freshPromiseAge: 1,
};
export const HOOK_AGENDA_LIMITS = {
    light: {
        staleDebt: 1,
        mustAdvance: 2,
        eligibleResolve: 1,
        avoidFamilies: 2,
    },
    medium: {
        staleDebt: 2,
        mustAdvance: 2,
        eligibleResolve: 1,
        avoidFamilies: 3,
    },
    heavy: {
        staleDebt: 3,
        mustAdvance: 3,
        eligibleResolve: 2,
        avoidFamilies: 4,
    },
};
export const HOOK_AGENDA_LOAD_THRESHOLDS = {
    heavyReadyCount: 3,
    heavyStaleCount: 4,
    heavyCriticalCount: 3,
    heavyPressuredCount: 6,
    mediumReadyCount: 2,
    mediumStaleCount: 2,
    mediumCriticalCount: 1,
    mediumPressuredFamilies: 3,
};
export const HOOK_VISIBILITY_WINDOWS = {
    immediate: 5,
    "near-term": 5,
    "mid-arc": 6,
    "slow-burn": 8,
    endgame: 10,
};
export const HOOK_RELEVANT_SELECTION_DEFAULTS = {
    primary: {
        baseLimit: 3,
        pressuredExpansionLimit: 4,
        pressuredThreshold: 4,
    },
    stale: {
        defaultLimit: 1,
        expandedLimit: 2,
        overdueThreshold: 2,
        familySpreadThreshold: 2,
    },
};
export const HOOK_HEALTH_DEFAULTS = {
    maxActiveHooks: 12,
    staleAfterChapters: 10,
    noAdvanceWindow: 5,
    newHookBurstThreshold: 2,
};
export function resolveHookVisibilityWindow(timing) {
    return HOOK_VISIBILITY_WINDOWS[timing];
}
//# sourceMappingURL=hook-policy.js.map