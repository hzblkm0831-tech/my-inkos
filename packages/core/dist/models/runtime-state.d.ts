import { z } from "zod";
export declare const RuntimeStateLanguageSchema: z.ZodEnum<["zh", "en"]>;
export type RuntimeStateLanguage = z.infer<typeof RuntimeStateLanguageSchema>;
export declare const StateManifestSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<2>;
    language: z.ZodEnum<["zh", "en"]>;
    lastAppliedChapter: z.ZodNumber;
    projectionVersion: z.ZodNumber;
    migrationWarnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    language: "zh" | "en";
    schemaVersion: 2;
    lastAppliedChapter: number;
    projectionVersion: number;
    migrationWarnings: string[];
}, {
    language: "zh" | "en";
    schemaVersion: 2;
    lastAppliedChapter: number;
    projectionVersion: number;
    migrationWarnings?: string[] | undefined;
}>;
export type StateManifest = z.infer<typeof StateManifestSchema>;
export declare const HookStatusSchema: z.ZodEnum<["open", "progressing", "deferred", "resolved"]>;
export type HookStatus = z.infer<typeof HookStatusSchema>;
export declare const HookPayoffTimingSchema: z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>;
export type HookPayoffTiming = z.infer<typeof HookPayoffTimingSchema>;
export declare const HookRecordSchema: z.ZodObject<{
    hookId: z.ZodString;
    startChapter: z.ZodNumber;
    type: z.ZodString;
    status: z.ZodEnum<["open", "progressing", "deferred", "resolved"]>;
    lastAdvancedChapter: z.ZodNumber;
    expectedPayoff: z.ZodDefault<z.ZodString>;
    payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
    notes: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    status: "open" | "progressing" | "resolved" | "deferred";
    hookId: string;
    startChapter: number;
    lastAdvancedChapter: number;
    expectedPayoff: string;
    notes: string;
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
}, {
    type: string;
    status: "open" | "progressing" | "resolved" | "deferred";
    hookId: string;
    startChapter: number;
    lastAdvancedChapter: number;
    expectedPayoff?: string | undefined;
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    notes?: string | undefined;
}>;
export type HookRecord = z.infer<typeof HookRecordSchema>;
export declare const HooksStateSchema: z.ZodObject<{
    hooks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        hookId: z.ZodString;
        startChapter: z.ZodNumber;
        type: z.ZodString;
        status: z.ZodEnum<["open", "progressing", "deferred", "resolved"]>;
        lastAdvancedChapter: z.ZodNumber;
        expectedPayoff: z.ZodDefault<z.ZodString>;
        payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }, {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    hooks: {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }[];
}, {
    hooks?: {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }[] | undefined;
}>;
export type HooksState = z.infer<typeof HooksStateSchema>;
export declare const ChapterSummaryRowSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    title: z.ZodString;
    characters: z.ZodDefault<z.ZodString>;
    events: z.ZodDefault<z.ZodString>;
    stateChanges: z.ZodDefault<z.ZodString>;
    hookActivity: z.ZodDefault<z.ZodString>;
    mood: z.ZodDefault<z.ZodString>;
    chapterType: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    chapter: number;
    events: string;
    characters: string;
    stateChanges: string;
    hookActivity: string;
    mood: string;
    chapterType: string;
}, {
    title: string;
    chapter: number;
    events?: string | undefined;
    characters?: string | undefined;
    stateChanges?: string | undefined;
    hookActivity?: string | undefined;
    mood?: string | undefined;
    chapterType?: string | undefined;
}>;
export type ChapterSummaryRow = z.infer<typeof ChapterSummaryRowSchema>;
export declare const ChapterSummariesStateSchema: z.ZodObject<{
    rows: z.ZodDefault<z.ZodArray<z.ZodObject<{
        chapter: z.ZodNumber;
        title: z.ZodString;
        characters: z.ZodDefault<z.ZodString>;
        events: z.ZodDefault<z.ZodString>;
        stateChanges: z.ZodDefault<z.ZodString>;
        hookActivity: z.ZodDefault<z.ZodString>;
        mood: z.ZodDefault<z.ZodString>;
        chapterType: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        chapter: number;
        events: string;
        characters: string;
        stateChanges: string;
        hookActivity: string;
        mood: string;
        chapterType: string;
    }, {
        title: string;
        chapter: number;
        events?: string | undefined;
        characters?: string | undefined;
        stateChanges?: string | undefined;
        hookActivity?: string | undefined;
        mood?: string | undefined;
        chapterType?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    rows: {
        title: string;
        chapter: number;
        events: string;
        characters: string;
        stateChanges: string;
        hookActivity: string;
        mood: string;
        chapterType: string;
    }[];
}, {
    rows?: {
        title: string;
        chapter: number;
        events?: string | undefined;
        characters?: string | undefined;
        stateChanges?: string | undefined;
        hookActivity?: string | undefined;
        mood?: string | undefined;
        chapterType?: string | undefined;
    }[] | undefined;
}>;
export type ChapterSummariesState = z.infer<typeof ChapterSummariesStateSchema>;
export declare const CurrentStateFactSchema: z.ZodObject<{
    subject: z.ZodString;
    predicate: z.ZodString;
    object: z.ZodString;
    validFromChapter: z.ZodNumber;
    validUntilChapter: z.ZodNullable<z.ZodNumber>;
    sourceChapter: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    object: string;
    subject: string;
    predicate: string;
    validFromChapter: number;
    validUntilChapter: number | null;
    sourceChapter: number;
}, {
    object: string;
    subject: string;
    predicate: string;
    validFromChapter: number;
    validUntilChapter: number | null;
    sourceChapter: number;
}>;
export type CurrentStateFact = z.infer<typeof CurrentStateFactSchema>;
export declare const CurrentStateStateSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    facts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        subject: z.ZodString;
        predicate: z.ZodString;
        object: z.ZodString;
        validFromChapter: z.ZodNumber;
        validUntilChapter: z.ZodNullable<z.ZodNumber>;
        sourceChapter: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        object: string;
        subject: string;
        predicate: string;
        validFromChapter: number;
        validUntilChapter: number | null;
        sourceChapter: number;
    }, {
        object: string;
        subject: string;
        predicate: string;
        validFromChapter: number;
        validUntilChapter: number | null;
        sourceChapter: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    chapter: number;
    facts: {
        object: string;
        subject: string;
        predicate: string;
        validFromChapter: number;
        validUntilChapter: number | null;
        sourceChapter: number;
    }[];
}, {
    chapter: number;
    facts?: {
        object: string;
        subject: string;
        predicate: string;
        validFromChapter: number;
        validUntilChapter: number | null;
        sourceChapter: number;
    }[] | undefined;
}>;
export type CurrentStateState = z.infer<typeof CurrentStateStateSchema>;
export declare const CurrentStatePatchSchema: z.ZodObject<{
    currentLocation: z.ZodOptional<z.ZodString>;
    protagonistState: z.ZodOptional<z.ZodString>;
    currentGoal: z.ZodOptional<z.ZodString>;
    currentConstraint: z.ZodOptional<z.ZodString>;
    currentAlliances: z.ZodOptional<z.ZodString>;
    currentConflict: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currentLocation?: string | undefined;
    protagonistState?: string | undefined;
    currentGoal?: string | undefined;
    currentConstraint?: string | undefined;
    currentAlliances?: string | undefined;
    currentConflict?: string | undefined;
}, {
    currentLocation?: string | undefined;
    protagonistState?: string | undefined;
    currentGoal?: string | undefined;
    currentConstraint?: string | undefined;
    currentAlliances?: string | undefined;
    currentConflict?: string | undefined;
}>;
export type CurrentStatePatch = z.infer<typeof CurrentStatePatchSchema>;
export declare const HookOpsSchema: z.ZodObject<{
    upsert: z.ZodDefault<z.ZodArray<z.ZodObject<{
        hookId: z.ZodString;
        startChapter: z.ZodNumber;
        type: z.ZodString;
        status: z.ZodEnum<["open", "progressing", "deferred", "resolved"]>;
        lastAdvancedChapter: z.ZodNumber;
        expectedPayoff: z.ZodDefault<z.ZodString>;
        payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }, {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }>, "many">>;
    mention: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    resolve: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    defer: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    upsert: {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }[];
    mention: string[];
    resolve: string[];
    defer: string[];
}, {
    upsert?: {
        type: string;
        status: "open" | "progressing" | "resolved" | "deferred";
        hookId: string;
        startChapter: number;
        lastAdvancedChapter: number;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }[] | undefined;
    mention?: string[] | undefined;
    resolve?: string[] | undefined;
    defer?: string[] | undefined;
}>;
export type HookOps = z.infer<typeof HookOpsSchema>;
export declare const NewHookCandidateSchema: z.ZodObject<{
    type: z.ZodString;
    expectedPayoff: z.ZodDefault<z.ZodString>;
    payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
    notes: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    expectedPayoff: string;
    notes: string;
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
}, {
    type: string;
    expectedPayoff?: string | undefined;
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    notes?: string | undefined;
}>;
export type NewHookCandidate = z.infer<typeof NewHookCandidateSchema>;
export declare const RuntimeStateDeltaSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    currentStatePatch: z.ZodOptional<z.ZodObject<{
        currentLocation: z.ZodOptional<z.ZodString>;
        protagonistState: z.ZodOptional<z.ZodString>;
        currentGoal: z.ZodOptional<z.ZodString>;
        currentConstraint: z.ZodOptional<z.ZodString>;
        currentAlliances: z.ZodOptional<z.ZodString>;
        currentConflict: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currentLocation?: string | undefined;
        protagonistState?: string | undefined;
        currentGoal?: string | undefined;
        currentConstraint?: string | undefined;
        currentAlliances?: string | undefined;
        currentConflict?: string | undefined;
    }, {
        currentLocation?: string | undefined;
        protagonistState?: string | undefined;
        currentGoal?: string | undefined;
        currentConstraint?: string | undefined;
        currentAlliances?: string | undefined;
        currentConflict?: string | undefined;
    }>>;
    hookOps: z.ZodDefault<z.ZodObject<{
        upsert: z.ZodDefault<z.ZodArray<z.ZodObject<{
            hookId: z.ZodString;
            startChapter: z.ZodNumber;
            type: z.ZodString;
            status: z.ZodEnum<["open", "progressing", "deferred", "resolved"]>;
            lastAdvancedChapter: z.ZodNumber;
            expectedPayoff: z.ZodDefault<z.ZodString>;
            payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
            notes: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff: string;
            notes: string;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }, {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff?: string | undefined;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            notes?: string | undefined;
        }>, "many">>;
        mention: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        resolve: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        defer: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        upsert: {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff: string;
            notes: string;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }[];
        mention: string[];
        resolve: string[];
        defer: string[];
    }, {
        upsert?: {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff?: string | undefined;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            notes?: string | undefined;
        }[] | undefined;
        mention?: string[] | undefined;
        resolve?: string[] | undefined;
        defer?: string[] | undefined;
    }>>;
    newHookCandidates: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        expectedPayoff: z.ZodDefault<z.ZodString>;
        payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }, {
        type: string;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }>, "many">>;
    chapterSummary: z.ZodOptional<z.ZodObject<{
        chapter: z.ZodNumber;
        title: z.ZodString;
        characters: z.ZodDefault<z.ZodString>;
        events: z.ZodDefault<z.ZodString>;
        stateChanges: z.ZodDefault<z.ZodString>;
        hookActivity: z.ZodDefault<z.ZodString>;
        mood: z.ZodDefault<z.ZodString>;
        chapterType: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        chapter: number;
        events: string;
        characters: string;
        stateChanges: string;
        hookActivity: string;
        mood: string;
        chapterType: string;
    }, {
        title: string;
        chapter: number;
        events?: string | undefined;
        characters?: string | undefined;
        stateChanges?: string | undefined;
        hookActivity?: string | undefined;
        mood?: string | undefined;
        chapterType?: string | undefined;
    }>>;
    subplotOps: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    emotionalArcOps: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    characterMatrixOps: z.ZodDefault<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
    notes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    chapter: number;
    notes: string[];
    hookOps: {
        upsert: {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff: string;
            notes: string;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }[];
        mention: string[];
        resolve: string[];
        defer: string[];
    };
    newHookCandidates: {
        type: string;
        expectedPayoff: string;
        notes: string;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }[];
    subplotOps: Record<string, unknown>[];
    emotionalArcOps: Record<string, unknown>[];
    characterMatrixOps: Record<string, unknown>[];
    currentStatePatch?: {
        currentLocation?: string | undefined;
        protagonistState?: string | undefined;
        currentGoal?: string | undefined;
        currentConstraint?: string | undefined;
        currentAlliances?: string | undefined;
        currentConflict?: string | undefined;
    } | undefined;
    chapterSummary?: {
        title: string;
        chapter: number;
        events: string;
        characters: string;
        stateChanges: string;
        hookActivity: string;
        mood: string;
        chapterType: string;
    } | undefined;
}, {
    chapter: number;
    notes?: string[] | undefined;
    currentStatePatch?: {
        currentLocation?: string | undefined;
        protagonistState?: string | undefined;
        currentGoal?: string | undefined;
        currentConstraint?: string | undefined;
        currentAlliances?: string | undefined;
        currentConflict?: string | undefined;
    } | undefined;
    hookOps?: {
        upsert?: {
            type: string;
            status: "open" | "progressing" | "resolved" | "deferred";
            hookId: string;
            startChapter: number;
            lastAdvancedChapter: number;
            expectedPayoff?: string | undefined;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            notes?: string | undefined;
        }[] | undefined;
        mention?: string[] | undefined;
        resolve?: string[] | undefined;
        defer?: string[] | undefined;
    } | undefined;
    newHookCandidates?: {
        type: string;
        expectedPayoff?: string | undefined;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        notes?: string | undefined;
    }[] | undefined;
    chapterSummary?: {
        title: string;
        chapter: number;
        events?: string | undefined;
        characters?: string | undefined;
        stateChanges?: string | undefined;
        hookActivity?: string | undefined;
        mood?: string | undefined;
        chapterType?: string | undefined;
    } | undefined;
    subplotOps?: Record<string, unknown>[] | undefined;
    emotionalArcOps?: Record<string, unknown>[] | undefined;
    characterMatrixOps?: Record<string, unknown>[] | undefined;
}>;
export type RuntimeStateDelta = z.infer<typeof RuntimeStateDeltaSchema>;
//# sourceMappingURL=runtime-state.d.ts.map