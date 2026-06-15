export declare const CADENCE_WINDOW_DEFAULTS: {
    readonly summaryLookback: 4;
    readonly englishVarianceLookback: 24;
    readonly recentBoundaryPatternBodies: 2;
};
export declare const CADENCE_PRESSURE_THRESHOLDS: {
    readonly scene: {
        readonly highCount: 3;
        readonly mediumCount: 2;
        readonly mediumWindowFloor: 4;
    };
    readonly mood: {
        readonly highCount: 3;
        readonly mediumCount: 2;
        readonly mediumWindowFloor: 4;
    };
    readonly title: {
        readonly minimumRepeatedCount: 2;
        readonly highCount: 3;
        readonly mediumCount: 2;
        readonly mediumWindowFloor: 4;
    };
};
export declare const LONG_SPAN_FATIGUE_THRESHOLDS: {
    readonly boundarySimilarityFloor: 0.72;
    readonly boundarySentenceMinLength: 18;
    readonly boundaryPatternMinBodies: 3;
};
export declare function resolveCadencePressure(params: {
    readonly count: number;
    readonly total: number;
    readonly highThreshold: number;
    readonly mediumThreshold: number;
    readonly mediumWindowFloor: number;
}): "medium" | "high" | undefined;
//# sourceMappingURL=cadence-policy.d.ts.map