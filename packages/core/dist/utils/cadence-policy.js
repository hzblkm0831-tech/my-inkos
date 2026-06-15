export const CADENCE_WINDOW_DEFAULTS = {
    summaryLookback: 4,
    englishVarianceLookback: 24,
    recentBoundaryPatternBodies: 2,
};
export const CADENCE_PRESSURE_THRESHOLDS = {
    scene: {
        highCount: 3,
        mediumCount: 2,
        mediumWindowFloor: 4,
    },
    mood: {
        highCount: 3,
        mediumCount: 2,
        mediumWindowFloor: 4,
    },
    title: {
        minimumRepeatedCount: 2,
        highCount: 3,
        mediumCount: 2,
        mediumWindowFloor: 4,
    },
};
export const LONG_SPAN_FATIGUE_THRESHOLDS = {
    boundarySimilarityFloor: 0.72,
    boundarySentenceMinLength: 18,
    boundaryPatternMinBodies: 3,
};
export function resolveCadencePressure(params) {
    if (params.count >= params.highThreshold) {
        return "high";
    }
    if (params.count >= params.mediumThreshold && params.total >= params.mediumWindowFloor) {
        return "medium";
    }
    return undefined;
}
//# sourceMappingURL=cadence-policy.js.map