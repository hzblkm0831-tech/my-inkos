import { z } from "zod";
export declare const ChapterConflictSchema: z.ZodObject<{
    type: z.ZodString;
    resolution: z.ZodString;
    detail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    resolution: string;
    detail?: string | undefined;
}, {
    type: string;
    resolution: string;
    detail?: string | undefined;
}>;
export type ChapterConflict = z.infer<typeof ChapterConflictSchema>;
export declare const HookPressurePhaseSchema: z.ZodEnum<["opening", "middle", "late"]>;
export type HookPressurePhase = z.infer<typeof HookPressurePhaseSchema>;
export declare const HookMovementSchema: z.ZodEnum<["quiet-hold", "refresh", "advance", "partial-payoff", "full-payoff"]>;
export type HookMovement = z.infer<typeof HookMovementSchema>;
export declare const HookPressureLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export type HookPressureLevel = z.infer<typeof HookPressureLevelSchema>;
export declare const HookPressureReasonSchema: z.ZodEnum<["fresh-promise", "building-debt", "stale-promise", "ripe-payoff", "overdue-payoff", "long-arc-hold"]>;
export type HookPressureReason = z.infer<typeof HookPressureReasonSchema>;
export declare const HookPressureSchema: z.ZodObject<{
    hookId: z.ZodString;
    type: z.ZodString;
    movement: z.ZodEnum<["quiet-hold", "refresh", "advance", "partial-payoff", "full-payoff"]>;
    pressure: z.ZodEnum<["low", "medium", "high", "critical"]>;
    payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
    phase: z.ZodEnum<["opening", "middle", "late"]>;
    reason: z.ZodEnum<["fresh-promise", "building-debt", "stale-promise", "ripe-payoff", "overdue-payoff", "long-arc-hold"]>;
    blockSiblingHooks: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: string;
    reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
    hookId: string;
    movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
    pressure: "low" | "medium" | "high" | "critical";
    phase: "opening" | "middle" | "late";
    blockSiblingHooks: boolean;
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
}, {
    type: string;
    reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
    hookId: string;
    movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
    pressure: "low" | "medium" | "high" | "critical";
    phase: "opening" | "middle" | "late";
    payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    blockSiblingHooks?: boolean | undefined;
}>;
export type HookPressure = z.infer<typeof HookPressureSchema>;
export declare const HookAgendaSchema: z.ZodObject<{
    pressureMap: z.ZodDefault<z.ZodArray<z.ZodObject<{
        hookId: z.ZodString;
        type: z.ZodString;
        movement: z.ZodEnum<["quiet-hold", "refresh", "advance", "partial-payoff", "full-payoff"]>;
        pressure: z.ZodEnum<["low", "medium", "high", "critical"]>;
        payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
        phase: z.ZodEnum<["opening", "middle", "late"]>;
        reason: z.ZodEnum<["fresh-promise", "building-debt", "stale-promise", "ripe-payoff", "overdue-payoff", "long-arc-hold"]>;
        blockSiblingHooks: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
        hookId: string;
        movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
        pressure: "low" | "medium" | "high" | "critical";
        phase: "opening" | "middle" | "late";
        blockSiblingHooks: boolean;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }, {
        type: string;
        reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
        hookId: string;
        movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
        pressure: "low" | "medium" | "high" | "critical";
        phase: "opening" | "middle" | "late";
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        blockSiblingHooks?: boolean | undefined;
    }>, "many">>;
    mustAdvance: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    eligibleResolve: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    staleDebt: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    avoidNewHookFamilies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    pressureMap: {
        type: string;
        reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
        hookId: string;
        movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
        pressure: "low" | "medium" | "high" | "critical";
        phase: "opening" | "middle" | "late";
        blockSiblingHooks: boolean;
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
    }[];
    mustAdvance: string[];
    eligibleResolve: string[];
    staleDebt: string[];
    avoidNewHookFamilies: string[];
}, {
    pressureMap?: {
        type: string;
        reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
        hookId: string;
        movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
        pressure: "low" | "medium" | "high" | "critical";
        phase: "opening" | "middle" | "late";
        payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        blockSiblingHooks?: boolean | undefined;
    }[] | undefined;
    mustAdvance?: string[] | undefined;
    eligibleResolve?: string[] | undefined;
    staleDebt?: string[] | undefined;
    avoidNewHookFamilies?: string[] | undefined;
}>;
export type HookAgenda = z.infer<typeof HookAgendaSchema>;
export declare const ChapterIntentSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    goal: z.ZodString;
    outlineNode: z.ZodOptional<z.ZodString>;
    sceneDirective: z.ZodOptional<z.ZodString>;
    arcDirective: z.ZodOptional<z.ZodString>;
    moodDirective: z.ZodOptional<z.ZodString>;
    titleDirective: z.ZodOptional<z.ZodString>;
    mustKeep: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    mustAvoid: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    styleEmphasis: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    conflicts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        resolution: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        resolution: string;
        detail?: string | undefined;
    }, {
        type: string;
        resolution: string;
        detail?: string | undefined;
    }>, "many">>;
    hookAgenda: z.ZodDefault<z.ZodObject<{
        pressureMap: z.ZodDefault<z.ZodArray<z.ZodObject<{
            hookId: z.ZodString;
            type: z.ZodString;
            movement: z.ZodEnum<["quiet-hold", "refresh", "advance", "partial-payoff", "full-payoff"]>;
            pressure: z.ZodEnum<["low", "medium", "high", "critical"]>;
            payoffTiming: z.ZodOptional<z.ZodEnum<["immediate", "near-term", "mid-arc", "slow-burn", "endgame"]>>;
            phase: z.ZodEnum<["opening", "middle", "late"]>;
            reason: z.ZodEnum<["fresh-promise", "building-debt", "stale-promise", "ripe-payoff", "overdue-payoff", "long-arc-hold"]>;
            blockSiblingHooks: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            blockSiblingHooks: boolean;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }, {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            blockSiblingHooks?: boolean | undefined;
        }>, "many">>;
        mustAdvance: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        eligibleResolve: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        staleDebt: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        avoidNewHookFamilies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        pressureMap: {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            blockSiblingHooks: boolean;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }[];
        mustAdvance: string[];
        eligibleResolve: string[];
        staleDebt: string[];
        avoidNewHookFamilies: string[];
    }, {
        pressureMap?: {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            blockSiblingHooks?: boolean | undefined;
        }[] | undefined;
        mustAdvance?: string[] | undefined;
        eligibleResolve?: string[] | undefined;
        staleDebt?: string[] | undefined;
        avoidNewHookFamilies?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    chapter: number;
    goal: string;
    mustKeep: string[];
    mustAvoid: string[];
    styleEmphasis: string[];
    conflicts: {
        type: string;
        resolution: string;
        detail?: string | undefined;
    }[];
    hookAgenda: {
        pressureMap: {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            blockSiblingHooks: boolean;
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
        }[];
        mustAdvance: string[];
        eligibleResolve: string[];
        staleDebt: string[];
        avoidNewHookFamilies: string[];
    };
    outlineNode?: string | undefined;
    sceneDirective?: string | undefined;
    arcDirective?: string | undefined;
    moodDirective?: string | undefined;
    titleDirective?: string | undefined;
}, {
    chapter: number;
    goal: string;
    outlineNode?: string | undefined;
    sceneDirective?: string | undefined;
    arcDirective?: string | undefined;
    moodDirective?: string | undefined;
    titleDirective?: string | undefined;
    mustKeep?: string[] | undefined;
    mustAvoid?: string[] | undefined;
    styleEmphasis?: string[] | undefined;
    conflicts?: {
        type: string;
        resolution: string;
        detail?: string | undefined;
    }[] | undefined;
    hookAgenda?: {
        pressureMap?: {
            type: string;
            reason: "fresh-promise" | "building-debt" | "stale-promise" | "ripe-payoff" | "overdue-payoff" | "long-arc-hold";
            hookId: string;
            movement: "quiet-hold" | "refresh" | "advance" | "partial-payoff" | "full-payoff";
            pressure: "low" | "medium" | "high" | "critical";
            phase: "opening" | "middle" | "late";
            payoffTiming?: "immediate" | "near-term" | "mid-arc" | "slow-burn" | "endgame" | undefined;
            blockSiblingHooks?: boolean | undefined;
        }[] | undefined;
        mustAdvance?: string[] | undefined;
        eligibleResolve?: string[] | undefined;
        staleDebt?: string[] | undefined;
        avoidNewHookFamilies?: string[] | undefined;
    } | undefined;
}>;
export type ChapterIntent = z.infer<typeof ChapterIntentSchema>;
export declare const ContextSourceSchema: z.ZodObject<{
    source: z.ZodString;
    reason: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    source: string;
    excerpt?: string | undefined;
}, {
    reason: string;
    source: string;
    excerpt?: string | undefined;
}>;
export type ContextSource = z.infer<typeof ContextSourceSchema>;
export declare const ContextPackageSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    selectedContext: z.ZodDefault<z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        reason: z.ZodString;
        excerpt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        reason: string;
        source: string;
        excerpt?: string | undefined;
    }, {
        reason: string;
        source: string;
        excerpt?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    chapter: number;
    selectedContext: {
        reason: string;
        source: string;
        excerpt?: string | undefined;
    }[];
}, {
    chapter: number;
    selectedContext?: {
        reason: string;
        source: string;
        excerpt?: string | undefined;
    }[] | undefined;
}>;
export type ContextPackage = z.infer<typeof ContextPackageSchema>;
export declare const RuleLayerScopeSchema: z.ZodEnum<["global", "book", "arc", "local"]>;
export type RuleLayerScope = z.infer<typeof RuleLayerScopeSchema>;
export declare const RuleLayerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    precedence: z.ZodNumber;
    scope: z.ZodEnum<["global", "book", "arc", "local"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    precedence: number;
    scope: "global" | "book" | "arc" | "local";
}, {
    id: string;
    name: string;
    precedence: number;
    scope: "global" | "book" | "arc" | "local";
}>;
export type RuleLayer = z.infer<typeof RuleLayerSchema>;
export declare const OverrideEdgeSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    allowed: z.ZodBoolean;
    scope: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scope: string;
    from: string;
    to: string;
    allowed: boolean;
}, {
    scope: string;
    from: string;
    to: string;
    allowed: boolean;
}>;
export type OverrideEdge = z.infer<typeof OverrideEdgeSchema>;
export declare const ActiveOverrideSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    target: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    target: string;
    reason: string;
    from: string;
    to: string;
}, {
    target: string;
    reason: string;
    from: string;
    to: string;
}>;
export type ActiveOverride = z.infer<typeof ActiveOverrideSchema>;
export declare const RuleStackSectionsSchema: z.ZodObject<{
    hard: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    soft: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    diagnostic: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    hard: string[];
    soft: string[];
    diagnostic: string[];
}, {
    hard?: string[] | undefined;
    soft?: string[] | undefined;
    diagnostic?: string[] | undefined;
}>;
export type RuleStackSections = z.infer<typeof RuleStackSectionsSchema>;
export declare const RuleStackSchema: z.ZodObject<{
    layers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        precedence: z.ZodNumber;
        scope: z.ZodEnum<["global", "book", "arc", "local"]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        precedence: number;
        scope: "global" | "book" | "arc" | "local";
    }, {
        id: string;
        name: string;
        precedence: number;
        scope: "global" | "book" | "arc" | "local";
    }>, "many">;
    sections: z.ZodDefault<z.ZodObject<{
        hard: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        soft: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        diagnostic: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        hard: string[];
        soft: string[];
        diagnostic: string[];
    }, {
        hard?: string[] | undefined;
        soft?: string[] | undefined;
        diagnostic?: string[] | undefined;
    }>>;
    overrideEdges: z.ZodDefault<z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        allowed: z.ZodBoolean;
        scope: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        scope: string;
        from: string;
        to: string;
        allowed: boolean;
    }, {
        scope: string;
        from: string;
        to: string;
        allowed: boolean;
    }>, "many">>;
    activeOverrides: z.ZodDefault<z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        target: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        target: string;
        reason: string;
        from: string;
        to: string;
    }, {
        target: string;
        reason: string;
        from: string;
        to: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    layers: {
        id: string;
        name: string;
        precedence: number;
        scope: "global" | "book" | "arc" | "local";
    }[];
    sections: {
        hard: string[];
        soft: string[];
        diagnostic: string[];
    };
    overrideEdges: {
        scope: string;
        from: string;
        to: string;
        allowed: boolean;
    }[];
    activeOverrides: {
        target: string;
        reason: string;
        from: string;
        to: string;
    }[];
}, {
    layers: {
        id: string;
        name: string;
        precedence: number;
        scope: "global" | "book" | "arc" | "local";
    }[];
    sections?: {
        hard?: string[] | undefined;
        soft?: string[] | undefined;
        diagnostic?: string[] | undefined;
    } | undefined;
    overrideEdges?: {
        scope: string;
        from: string;
        to: string;
        allowed: boolean;
    }[] | undefined;
    activeOverrides?: {
        target: string;
        reason: string;
        from: string;
        to: string;
    }[] | undefined;
}>;
export type RuleStack = z.infer<typeof RuleStackSchema>;
export declare const ChapterTraceSchema: z.ZodObject<{
    chapter: z.ZodNumber;
    plannerInputs: z.ZodArray<z.ZodString, "many">;
    composerInputs: z.ZodArray<z.ZodString, "many">;
    selectedSources: z.ZodArray<z.ZodString, "many">;
    notes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    chapter: number;
    notes: string[];
    plannerInputs: string[];
    composerInputs: string[];
    selectedSources: string[];
}, {
    chapter: number;
    plannerInputs: string[];
    composerInputs: string[];
    selectedSources: string[];
    notes?: string[] | undefined;
}>;
export type ChapterTrace = z.infer<typeof ChapterTraceSchema>;
//# sourceMappingURL=input-governance.d.ts.map