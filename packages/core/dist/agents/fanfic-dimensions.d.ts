import type { FanficMode } from "../models/book.js";
export interface FanficDimensionConfig {
    readonly activeIds: ReadonlyArray<number>;
    readonly severityOverrides: ReadonlyMap<number, "critical" | "warning" | "info">;
    readonly deactivatedIds: ReadonlyArray<number>;
    readonly notes: ReadonlyMap<number, string>;
}
export declare const FANFIC_DIMENSIONS: ReadonlyArray<{
    readonly id: number;
    readonly name: string;
    readonly baseNote: string;
}>;
export declare function getFanficDimensionConfig(mode: FanficMode, _allowedDeviations?: ReadonlyArray<string>): FanficDimensionConfig;
//# sourceMappingURL=fanfic-dimensions.d.ts.map