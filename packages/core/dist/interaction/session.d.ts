import { z } from "zod";
import { type AutomationMode } from "./modes.js";
import { type InteractionEvent } from "./events.js";
export declare const PendingDecisionSchema: z.ZodObject<{
    kind: z.ZodString;
    bookId: z.ZodString;
    chapterNumber: z.ZodOptional<z.ZodNumber>;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bookId: string;
    kind: string;
    summary: string;
    chapterNumber?: number | undefined;
}, {
    bookId: string;
    kind: string;
    summary: string;
    chapterNumber?: number | undefined;
}>;
export type PendingDecision = z.infer<typeof PendingDecisionSchema>;
export declare const InteractionMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "system" | "user" | "assistant";
    timestamp: number;
}, {
    content: string;
    role: "system" | "user" | "assistant";
    timestamp: number;
}>;
export type InteractionMessage = z.infer<typeof InteractionMessageSchema>;
export declare const BookCreationDraftSchema: z.ZodObject<{
    concept: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    genre: z.ZodOptional<z.ZodString>;
    platform: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodEnum<["zh", "en"]>>;
    targetChapters: z.ZodOptional<z.ZodNumber>;
    chapterWordCount: z.ZodOptional<z.ZodNumber>;
    blurb: z.ZodOptional<z.ZodString>;
    worldPremise: z.ZodOptional<z.ZodString>;
    settingNotes: z.ZodOptional<z.ZodString>;
    protagonist: z.ZodOptional<z.ZodString>;
    supportingCast: z.ZodOptional<z.ZodString>;
    conflictCore: z.ZodOptional<z.ZodString>;
    volumeOutline: z.ZodOptional<z.ZodString>;
    constraints: z.ZodOptional<z.ZodString>;
    authorIntent: z.ZodOptional<z.ZodString>;
    currentFocus: z.ZodOptional<z.ZodString>;
    nextQuestion: z.ZodOptional<z.ZodString>;
    missingFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    readyToCreate: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    concept: string;
    missingFields: string[];
    readyToCreate: boolean;
    title?: string | undefined;
    platform?: string | undefined;
    genre?: string | undefined;
    targetChapters?: number | undefined;
    chapterWordCount?: number | undefined;
    language?: "zh" | "en" | undefined;
    protagonist?: string | undefined;
    authorIntent?: string | undefined;
    currentFocus?: string | undefined;
    volumeOutline?: string | undefined;
    blurb?: string | undefined;
    worldPremise?: string | undefined;
    settingNotes?: string | undefined;
    supportingCast?: string | undefined;
    conflictCore?: string | undefined;
    constraints?: string | undefined;
    nextQuestion?: string | undefined;
}, {
    concept: string;
    title?: string | undefined;
    platform?: string | undefined;
    genre?: string | undefined;
    targetChapters?: number | undefined;
    chapterWordCount?: number | undefined;
    language?: "zh" | "en" | undefined;
    protagonist?: string | undefined;
    authorIntent?: string | undefined;
    currentFocus?: string | undefined;
    volumeOutline?: string | undefined;
    blurb?: string | undefined;
    worldPremise?: string | undefined;
    settingNotes?: string | undefined;
    supportingCast?: string | undefined;
    conflictCore?: string | undefined;
    constraints?: string | undefined;
    nextQuestion?: string | undefined;
    missingFields?: string[] | undefined;
    readyToCreate?: boolean | undefined;
}>;
export type BookCreationDraft = z.infer<typeof BookCreationDraftSchema>;
export declare const InteractionSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    projectRoot: z.ZodString;
    activeBookId: z.ZodOptional<z.ZodString>;
    activeChapterNumber: z.ZodOptional<z.ZodNumber>;
    creationDraft: z.ZodOptional<z.ZodObject<{
        concept: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        genre: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodEnum<["zh", "en"]>>;
        targetChapters: z.ZodOptional<z.ZodNumber>;
        chapterWordCount: z.ZodOptional<z.ZodNumber>;
        blurb: z.ZodOptional<z.ZodString>;
        worldPremise: z.ZodOptional<z.ZodString>;
        settingNotes: z.ZodOptional<z.ZodString>;
        protagonist: z.ZodOptional<z.ZodString>;
        supportingCast: z.ZodOptional<z.ZodString>;
        conflictCore: z.ZodOptional<z.ZodString>;
        volumeOutline: z.ZodOptional<z.ZodString>;
        constraints: z.ZodOptional<z.ZodString>;
        authorIntent: z.ZodOptional<z.ZodString>;
        currentFocus: z.ZodOptional<z.ZodString>;
        nextQuestion: z.ZodOptional<z.ZodString>;
        missingFields: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        readyToCreate: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        concept: string;
        missingFields: string[];
        readyToCreate: boolean;
        title?: string | undefined;
        platform?: string | undefined;
        genre?: string | undefined;
        targetChapters?: number | undefined;
        chapterWordCount?: number | undefined;
        language?: "zh" | "en" | undefined;
        protagonist?: string | undefined;
        authorIntent?: string | undefined;
        currentFocus?: string | undefined;
        volumeOutline?: string | undefined;
        blurb?: string | undefined;
        worldPremise?: string | undefined;
        settingNotes?: string | undefined;
        supportingCast?: string | undefined;
        conflictCore?: string | undefined;
        constraints?: string | undefined;
        nextQuestion?: string | undefined;
    }, {
        concept: string;
        title?: string | undefined;
        platform?: string | undefined;
        genre?: string | undefined;
        targetChapters?: number | undefined;
        chapterWordCount?: number | undefined;
        language?: "zh" | "en" | undefined;
        protagonist?: string | undefined;
        authorIntent?: string | undefined;
        currentFocus?: string | undefined;
        volumeOutline?: string | undefined;
        blurb?: string | undefined;
        worldPremise?: string | undefined;
        settingNotes?: string | undefined;
        supportingCast?: string | undefined;
        conflictCore?: string | undefined;
        constraints?: string | undefined;
        nextQuestion?: string | undefined;
        missingFields?: string[] | undefined;
        readyToCreate?: boolean | undefined;
    }>>;
    automationMode: z.ZodDefault<z.ZodEnum<["auto", "semi", "manual"]>>;
    messages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "system" | "user" | "assistant";
        timestamp: number;
    }, {
        content: string;
        role: "system" | "user" | "assistant";
        timestamp: number;
    }>, "many">>;
    events: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }>, "many">>;
    pendingDecision: z.ZodOptional<z.ZodObject<{
        kind: z.ZodString;
        bookId: z.ZodString;
        chapterNumber: z.ZodOptional<z.ZodNumber>;
        summary: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        bookId: string;
        kind: string;
        summary: string;
        chapterNumber?: number | undefined;
    }, {
        bookId: string;
        kind: string;
        summary: string;
        chapterNumber?: number | undefined;
    }>>;
    currentExecution: z.ZodOptional<z.ZodObject<{
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
    }>>;
}, "strip", z.ZodTypeAny, {
    events: {
        status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
        kind: string;
        timestamp: number;
        detail?: string | undefined;
        bookId?: string | undefined;
        chapterNumber?: number | undefined;
    }[];
    messages: {
        content: string;
        role: "system" | "user" | "assistant";
        timestamp: number;
    }[];
    sessionId: string;
    projectRoot: string;
    automationMode: "auto" | "semi" | "manual";
    activeBookId?: string | undefined;
    activeChapterNumber?: number | undefined;
    creationDraft?: {
        concept: string;
        missingFields: string[];
        readyToCreate: boolean;
        title?: string | undefined;
        platform?: string | undefined;
        genre?: string | undefined;
        targetChapters?: number | undefined;
        chapterWordCount?: number | undefined;
        language?: "zh" | "en" | undefined;
        protagonist?: string | undefined;
        authorIntent?: string | undefined;
        currentFocus?: string | undefined;
        volumeOutline?: string | undefined;
        blurb?: string | undefined;
        worldPremise?: string | undefined;
        settingNotes?: string | undefined;
        supportingCast?: string | undefined;
        conflictCore?: string | undefined;
        constraints?: string | undefined;
        nextQuestion?: string | undefined;
    } | undefined;
    pendingDecision?: {
        bookId: string;
        kind: string;
        summary: string;
        chapterNumber?: number | undefined;
    } | undefined;
    currentExecution?: {
        status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
        bookId?: string | undefined;
        chapterNumber?: number | undefined;
        stageLabel?: string | undefined;
    } | undefined;
}, {
    sessionId: string;
    projectRoot: string;
    events?: {
        status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
        kind: string;
        timestamp: number;
        detail?: string | undefined;
        bookId?: string | undefined;
        chapterNumber?: number | undefined;
    }[] | undefined;
    messages?: {
        content: string;
        role: "system" | "user" | "assistant";
        timestamp: number;
    }[] | undefined;
    activeBookId?: string | undefined;
    activeChapterNumber?: number | undefined;
    creationDraft?: {
        concept: string;
        title?: string | undefined;
        platform?: string | undefined;
        genre?: string | undefined;
        targetChapters?: number | undefined;
        chapterWordCount?: number | undefined;
        language?: "zh" | "en" | undefined;
        protagonist?: string | undefined;
        authorIntent?: string | undefined;
        currentFocus?: string | undefined;
        volumeOutline?: string | undefined;
        blurb?: string | undefined;
        worldPremise?: string | undefined;
        settingNotes?: string | undefined;
        supportingCast?: string | undefined;
        conflictCore?: string | undefined;
        constraints?: string | undefined;
        nextQuestion?: string | undefined;
        missingFields?: string[] | undefined;
        readyToCreate?: boolean | undefined;
    } | undefined;
    automationMode?: "auto" | "semi" | "manual" | undefined;
    pendingDecision?: {
        bookId: string;
        kind: string;
        summary: string;
        chapterNumber?: number | undefined;
    } | undefined;
    currentExecution?: {
        status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
        bookId?: string | undefined;
        chapterNumber?: number | undefined;
        stageLabel?: string | undefined;
    } | undefined;
}>;
export type InteractionSession = z.infer<typeof InteractionSessionSchema>;
export declare function bindActiveBook(session: InteractionSession, bookId: string, chapterNumber?: number): InteractionSession;
export declare function clearPendingDecision(session: InteractionSession): InteractionSession;
export declare function updateCreationDraft(session: InteractionSession, draft: BookCreationDraft): InteractionSession;
export declare function clearCreationDraft(session: InteractionSession): InteractionSession;
export declare function updateAutomationMode(session: InteractionSession, automationMode: AutomationMode): InteractionSession;
export declare function appendInteractionMessage(session: InteractionSession, message: InteractionMessage): InteractionSession;
export declare function appendInteractionEvent(session: InteractionSession, event: InteractionEvent): InteractionSession;
//# sourceMappingURL=session.d.ts.map