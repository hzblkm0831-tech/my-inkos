import type { HookAgenda } from "../models/input-governance.js";
import type { StoredHook } from "../state/memory-db.js";
export declare const DEFAULT_HOOK_LOOKAHEAD_CHAPTERS = 3;
/**
 * Build the hook agenda using simple stalest-first sorting.
 * No lifecycle pressure formulas — just pick the hooks that have been
 * dormant the longest and the ones that are ripe for resolution.
 */
export declare function buildPlannerHookAgenda(params: {
    readonly hooks: ReadonlyArray<StoredHook>;
    readonly chapterNumber: number;
    readonly targetChapters?: number;
    readonly language?: "zh" | "en";
    readonly maxMustAdvance?: number;
    readonly maxEligibleResolve?: number;
    readonly maxStaleDebt?: number;
}): HookAgenda;
export declare function filterActiveHooks(hooks: ReadonlyArray<StoredHook>): StoredHook[];
export declare function isFuturePlannedHook(hook: StoredHook, chapterNumber: number, lookahead?: number): boolean;
export declare function isHookWithinChapterWindow(hook: StoredHook, chapterNumber: number, recentWindow?: number, lookahead?: number): boolean;
//# sourceMappingURL=hook-agenda.d.ts.map