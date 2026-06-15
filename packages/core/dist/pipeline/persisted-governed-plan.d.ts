import type { PlanChapterOutput } from "../agents/planner.js";
export declare function loadPersistedPlan(bookDir: string, chapterNumber: number): Promise<PlanChapterOutput | null>;
export declare function relativeToBookDir(bookDir: string, absolutePath: string): string;
//# sourceMappingURL=persisted-governed-plan.d.ts.map