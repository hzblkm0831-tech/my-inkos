import { z } from "zod";
import { HookPayoffTimingSchema } from "./runtime-state.js";
export const ChapterConflictSchema = z.object({
    type: z.string().min(1),
    resolution: z.string().min(1),
    detail: z.string().optional(),
});
export const HookPressurePhaseSchema = z.enum(["opening", "middle", "late"]);
export const HookMovementSchema = z.enum([
    "quiet-hold",
    "refresh",
    "advance",
    "partial-payoff",
    "full-payoff",
]);
export const HookPressureLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const HookPressureReasonSchema = z.enum([
    "fresh-promise",
    "building-debt",
    "stale-promise",
    "ripe-payoff",
    "overdue-payoff",
    "long-arc-hold",
]);
export const HookPressureSchema = z.object({
    hookId: z.string().min(1),
    type: z.string().min(1),
    movement: HookMovementSchema,
    pressure: HookPressureLevelSchema,
    payoffTiming: HookPayoffTimingSchema.optional(),
    phase: HookPressurePhaseSchema,
    reason: HookPressureReasonSchema,
    blockSiblingHooks: z.boolean().default(false),
});
export const HookAgendaSchema = z.object({
    pressureMap: z.array(HookPressureSchema).default([]),
    mustAdvance: z.array(z.string().min(1)).default([]),
    eligibleResolve: z.array(z.string().min(1)).default([]),
    staleDebt: z.array(z.string().min(1)).default([]),
    avoidNewHookFamilies: z.array(z.string().min(1)).default([]),
});
export const ChapterIntentSchema = z.object({
    chapter: z.number().int().min(1),
    goal: z.string().min(1),
    outlineNode: z.string().optional(),
    sceneDirective: z.string().min(1).optional(),
    arcDirective: z.string().min(1).optional(),
    moodDirective: z.string().min(1).optional(),
    titleDirective: z.string().min(1).optional(),
    mustKeep: z.array(z.string()).default([]),
    mustAvoid: z.array(z.string()).default([]),
    styleEmphasis: z.array(z.string()).default([]),
    conflicts: z.array(ChapterConflictSchema).default([]),
    hookAgenda: HookAgendaSchema.default({
        pressureMap: [],
        mustAdvance: [],
        eligibleResolve: [],
        staleDebt: [],
        avoidNewHookFamilies: [],
    }),
});
export const ContextSourceSchema = z.object({
    source: z.string().min(1),
    reason: z.string().min(1),
    excerpt: z.string().optional(),
});
export const ContextPackageSchema = z.object({
    chapter: z.number().int().min(1),
    selectedContext: z.array(ContextSourceSchema).default([]),
});
export const RuleLayerScopeSchema = z.enum(["global", "book", "arc", "local"]);
export const RuleLayerSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    precedence: z.number().int(),
    scope: RuleLayerScopeSchema,
});
export const OverrideEdgeSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    allowed: z.boolean(),
    scope: z.string().min(1),
});
export const ActiveOverrideSchema = z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    target: z.string().min(1),
    reason: z.string().min(1),
});
export const RuleStackSectionsSchema = z.object({
    hard: z.array(z.string()).default([]),
    soft: z.array(z.string()).default([]),
    diagnostic: z.array(z.string()).default([]),
});
export const RuleStackSchema = z.object({
    layers: z.array(RuleLayerSchema).min(1),
    sections: RuleStackSectionsSchema.default({
        hard: [],
        soft: [],
        diagnostic: [],
    }),
    overrideEdges: z.array(OverrideEdgeSchema).default([]),
    activeOverrides: z.array(ActiveOverrideSchema).default([]),
});
export const ChapterTraceSchema = z.object({
    chapter: z.number().int().min(1),
    plannerInputs: z.array(z.string()),
    composerInputs: z.array(z.string()),
    selectedSources: z.array(z.string()),
    notes: z.array(z.string()).default([]),
});
//# sourceMappingURL=input-governance.js.map