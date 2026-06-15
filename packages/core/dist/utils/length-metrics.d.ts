import type { LengthCountingMode, LengthNormalizeMode, LengthSpec } from "../models/length-governance.js";
export type LengthLanguage = "zh" | "en";
export declare function countChapterLength(content: string, countingMode: LengthCountingMode): number;
export declare function resolveLengthCountingMode(language?: LengthLanguage): LengthCountingMode;
export declare function formatLengthCount(count: number, countingMode: LengthCountingMode): string;
export declare function buildLengthSpec(target: number, language?: LengthLanguage): LengthSpec;
export declare function isOutsideSoftRange(count: number, spec: Pick<LengthSpec, "softMin" | "softMax">): boolean;
export declare function isOutsideHardRange(count: number, spec: Pick<LengthSpec, "hardMin" | "hardMax">): boolean;
export declare function chooseNormalizeMode(count: number, spec: Pick<LengthSpec, "softMin" | "softMax">): LengthNormalizeMode;
//# sourceMappingURL=length-metrics.d.ts.map