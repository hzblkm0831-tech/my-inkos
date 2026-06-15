import { z } from "zod";
export declare const ChapterStatusSchema: z.ZodEnum<["card-generated", "drafting", "drafted", "auditing", "audit-passed", "audit-failed", "state-degraded", "revising", "ready-for-review", "approved", "rejected", "published", "imported"]>;
export type ChapterStatus = z.infer<typeof ChapterStatusSchema>;
export declare const ChapterMetaSchema: z.ZodObject<{
    number: z.ZodNumber;
    title: z.ZodString;
    status: z.ZodEnum<["card-generated", "drafting", "drafted", "auditing", "audit-passed", "audit-failed", "state-degraded", "revising", "ready-for-review", "approved", "rejected", "published", "imported"]>;
    wordCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    auditIssues: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    lengthWarnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    reviewNote: z.ZodOptional<z.ZodString>;
    detectionScore: z.ZodOptional<z.ZodNumber>;
    detectionProvider: z.ZodOptional<z.ZodString>;
    detectedAt: z.ZodOptional<z.ZodString>;
    lengthTelemetry: z.ZodOptional<z.ZodObject<{
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
    }>>;
    tokenUsage: z.ZodOptional<z.ZodObject<{
        promptTokens: z.ZodDefault<z.ZodNumber>;
        completionTokens: z.ZodDefault<z.ZodNumber>;
        totalTokens: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }, {
        promptTokens?: number | undefined;
        completionTokens?: number | undefined;
        totalTokens?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    number: number;
    status: "card-generated" | "drafting" | "drafted" | "auditing" | "audit-passed" | "audit-failed" | "state-degraded" | "revising" | "ready-for-review" | "approved" | "rejected" | "published" | "imported";
    title: string;
    createdAt: string;
    updatedAt: string;
    wordCount: number;
    auditIssues: string[];
    lengthWarnings: string[];
    reviewNote?: string | undefined;
    detectionScore?: number | undefined;
    detectionProvider?: string | undefined;
    detectedAt?: string | undefined;
    lengthTelemetry?: {
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
    } | undefined;
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    } | undefined;
}, {
    number: number;
    status: "card-generated" | "drafting" | "drafted" | "auditing" | "audit-passed" | "audit-failed" | "state-degraded" | "revising" | "ready-for-review" | "approved" | "rejected" | "published" | "imported";
    title: string;
    createdAt: string;
    updatedAt: string;
    wordCount?: number | undefined;
    auditIssues?: string[] | undefined;
    lengthWarnings?: string[] | undefined;
    reviewNote?: string | undefined;
    detectionScore?: number | undefined;
    detectionProvider?: string | undefined;
    detectedAt?: string | undefined;
    lengthTelemetry?: {
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
    } | undefined;
    tokenUsage?: {
        promptTokens?: number | undefined;
        completionTokens?: number | undefined;
        totalTokens?: number | undefined;
    } | undefined;
}>;
export type ChapterMeta = z.infer<typeof ChapterMetaSchema>;
//# sourceMappingURL=chapter.d.ts.map