/**
 * In-memory event store for run lifecycle tracking.
 * Ported from PR #96 (Te9ui1a) — immutable updates, pub/sub per run.
 */
import type { RunAction, RunLogEntry, RunStatus, RunStreamEvent, StudioRun } from "../../shared/contracts.js";
type RunSubscriber = (event: RunStreamEvent) => void;
export declare class RunStore {
    private readonly runs;
    private readonly subscribers;
    create(input: {
        bookId: string;
        chapterNumber?: number;
        action: RunAction;
    }): StudioRun;
    list(): ReadonlyArray<StudioRun>;
    get(runId: string): StudioRun | null;
    findActiveRun(bookId: string): StudioRun | null;
    markRunning(runId: string, stage: string): StudioRun;
    updateStage(runId: string, stage: string): StudioRun;
    appendLog(runId: string, log: RunLogEntry): StudioRun;
    succeed(runId: string, result: unknown): StudioRun;
    fail(runId: string, error: string): StudioRun;
    subscribe(runId: string, subscriber: RunSubscriber): () => void;
    private update;
    private publish;
}
export declare function isTerminalRunStatus(status: RunStatus): boolean;
export {};
//# sourceMappingURL=run-store.d.ts.map