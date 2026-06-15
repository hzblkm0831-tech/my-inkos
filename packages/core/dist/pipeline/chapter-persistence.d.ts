import type { AuditIssue, AuditResult } from "../agents/continuity.js";
import type { ChapterMeta } from "../models/chapter.js";
import type { LengthTelemetry } from "../models/length-governance.js";
export interface ChapterPersistenceUsage {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
}
export type ChapterPersistenceStatus = "ready-for-review" | "audit-failed" | "state-degraded";
export declare function persistChapterArtifacts(params: {
    readonly chapterNumber: number;
    readonly chapterTitle: string;
    readonly status: ChapterPersistenceStatus;
    readonly auditResult: AuditResult;
    readonly finalWordCount: number;
    readonly lengthWarnings: ReadonlyArray<string>;
    readonly lengthTelemetry?: LengthTelemetry;
    readonly degradedIssues: ReadonlyArray<AuditIssue>;
    readonly tokenUsage?: ChapterPersistenceUsage;
    readonly loadChapterIndex: () => Promise<ReadonlyArray<ChapterMeta>>;
    readonly saveChapter: () => Promise<void>;
    readonly saveTruthFiles: () => Promise<void>;
    readonly saveChapterIndex: (index: ReadonlyArray<ChapterMeta>) => Promise<void>;
    readonly markBookActiveIfNeeded: () => Promise<void>;
    readonly persistAuditDriftGuidance: (issues: ReadonlyArray<AuditIssue>) => Promise<void>;
    readonly snapshotState: () => Promise<void>;
    readonly syncCurrentStateFactHistory: () => Promise<void>;
    readonly logSnapshotStage: () => void;
    readonly now?: () => string;
}): Promise<{
    readonly entry: ChapterMeta;
}>;
//# sourceMappingURL=chapter-persistence.d.ts.map