import { z } from "zod";
export declare const LengthCountingModeSchema: z.ZodEnum<["zh_chars", "en_words"]>;
export type LengthCountingMode = z.infer<typeof LengthCountingModeSchema>;
export declare const LengthNormalizeModeSchema: z.ZodEnum<["expand", "compress", "none"]>;
export type LengthNormalizeMode = z.infer<typeof LengthNormalizeModeSchema>;
export declare const LengthSpecSchema: z.ZodObject<{
    target: z.ZodNumber;
    softMin: z.ZodNumber;
    softMax: z.ZodNumber;
    hardMin: z.ZodNumber;
    hardMax: z.ZodNumber;
    countingMode: z.ZodEnum<["zh_chars", "en_words"]>;
    normalizeMode: z.ZodEnum<["expand", "compress", "none"]>;
}, "strip", z.ZodTypeAny, {
    target: number;
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
    countingMode: "zh_chars" | "en_words";
    normalizeMode: "expand" | "compress" | "none";
}, {
    target: number;
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
    countingMode: "zh_chars" | "en_words";
    normalizeMode: "expand" | "compress" | "none";
}>;
export type LengthSpec = z.infer<typeof LengthSpecSchema>;
export declare const LengthTelemetrySchema: z.ZodObject<{
    target: z.ZodNumber;
    softMin: z.ZodNumber;
    softMax: z.ZodNumber;
    hardMin: z.ZodNumber;
    hardMax: z.ZodNumber;
    countingMode: z.ZodEnum<["zh_chars", "en_words"]>;
    writerCount: z.ZodNumber;
    postWriterNormalizeCount: z.ZodNumber;
    postReviseCount: z.ZodNumber;
    finalCount: z.ZodNumber;
    normalizeApplied: z.ZodBoolean;
    lengthWarning: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    target: number;
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
    countingMode: "zh_chars" | "en_words";
    writerCount: number;
    postWriterNormalizeCount: number;
    postReviseCount: number;
    finalCount: number;
    normalizeApplied: boolean;
    lengthWarning: boolean;
}, {
    target: number;
    softMin: number;
    softMax: number;
    hardMin: number;
    hardMax: number;
    countingMode: "zh_chars" | "en_words";
    writerCount: number;
    postWriterNormalizeCount: number;
    postReviseCount: number;
    finalCount: number;
    normalizeApplied: boolean;
    lengthWarning: boolean;
}>;
export type LengthTelemetry = z.infer<typeof LengthTelemetrySchema>;
export declare const LengthWarningSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    target: z.ZodNumber;
    actual: z.ZodNumber;
    countingMode: z.ZodEnum<["zh_chars", "en_words"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    target: number;
    countingMode: "zh_chars" | "en_words";
    chapter: number;
    actual: number;
    reason: string;
}, {
    target: number;
    countingMode: "zh_chars" | "en_words";
    chapter: number;
    actual: number;
    reason: string;
}>;
export type LengthWarning = z.infer<typeof LengthWarningSchema>;
//# sourceMappingURL=length-governance.d.ts.map