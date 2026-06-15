import { z } from "zod";
export declare const ExecutionStatusSchema: z.ZodEnum<["idle", "planning", "composing", "writing", "assessing", "repairing", "persisting", "waiting_human", "blocked", "completed", "failed"]>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
export declare const ExecutionStateSchema: z.ZodObject<{
    status: z.ZodEnum<["idle", "planning", "composing", "writing", "assessing", "repairing", "persisting", "waiting_human", "blocked", "completed", "failed"]>;
    bookId: z.ZodOptional<z.ZodString>;
    chapterNumber: z.ZodOptional<z.ZodNumber>;
    stageLabel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
    bookId?: string | undefined;
    chapterNumber?: number | undefined;
    stageLabel?: string | undefined;
}, {
    status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
    bookId?: string | undefined;
    chapterNumber?: number | undefined;
    stageLabel?: string | undefined;
}>;
export type ExecutionState = z.infer<typeof ExecutionStateSchema>;
export declare const InteractionEventSchema: z.ZodObject<{
    kind: z.ZodString;
    timestamp: z.ZodNumber;
    status: z.ZodEnum<["idle", "planning", "composing", "writing", "assessing", "repairing", "persisting", "waiting_human", "blocked", "completed", "failed"]>;
    bookId: z.ZodOptional<z.ZodString>;
    chapterNumber: z.ZodOptional<z.ZodNumber>;
    detail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
    kind: string;
    timestamp: number;
    detail?: string | undefined;
    bookId?: string | undefined;
    chapterNumber?: number | undefined;
}, {
    status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
    kind: string;
    timestamp: number;
    detail?: string | undefined;
    bookId?: string | undefined;
    chapterNumber?: number | undefined;
}>;
export type InteractionEvent = z.infer<typeof InteractionEventSchema>;
export declare function isTerminalExecutionStatus(status: ExecutionStatus): boolean;
//# sourceMappingURL=events.d.ts.map