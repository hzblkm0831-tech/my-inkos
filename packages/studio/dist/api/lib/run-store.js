/**
 * In-memory event store for run lifecycle tracking.
 * Ported from PR #96 (Te9ui1a) — immutable updates, pub/sub per run.
 */
import { randomUUID } from "node:crypto";
export class RunStore {
    runs = new Map();
    subscribers = new Map();
    create(input) {
        const now = new Date().toISOString();
        const run = {
            id: randomUUID(),
            bookId: input.bookId,
            chapter: input.chapterNumber ?? null,
            chapterNumber: input.chapterNumber ?? null,
            action: input.action,
            status: "queued",
            stage: "Queued",
            createdAt: now,
            updatedAt: now,
            startedAt: null,
            finishedAt: null,
            logs: [],
        };
        this.runs.set(run.id, run);
        this.publish(run.id, { type: "snapshot", runId: run.id, run });
        return run;
    }
    list() {
        return [...this.runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    get(runId) {
        return this.runs.get(runId) ?? null;
    }
    findActiveRun(bookId) {
        for (const run of this.runs.values()) {
            if (run.bookId === bookId &&
                (run.status === "queued" || run.status === "running")) {
                return run;
            }
        }
        return null;
    }
    markRunning(runId, stage) {
        return this.update(runId, { status: "running", stage, startedAt: new Date().toISOString() }, [
            { type: "status", runId, status: "running" },
            { type: "stage", runId, stage },
        ]);
    }
    updateStage(runId, stage) {
        return this.update(runId, { stage }, [{ type: "stage", runId, stage }]);
    }
    appendLog(runId, log) {
        return this.update(runId, (run) => ({ logs: [...run.logs, log] }), [
            { type: "log", runId, log },
        ]);
    }
    succeed(runId, result) {
        return this.update(runId, {
            status: "succeeded",
            stage: "Completed",
            finishedAt: new Date().toISOString(),
            result,
            error: undefined,
        }, [{ type: "status", runId, status: "succeeded", result }], true);
    }
    fail(runId, error) {
        return this.update(runId, {
            status: "failed",
            stage: "Failed",
            finishedAt: new Date().toISOString(),
            error,
        }, [{ type: "status", runId, status: "failed", error }], true);
    }
    subscribe(runId, subscriber) {
        const current = this.subscribers.get(runId) ?? new Set();
        current.add(subscriber);
        this.subscribers.set(runId, current);
        return () => {
            const listeners = this.subscribers.get(runId);
            if (!listeners)
                return;
            listeners.delete(subscriber);
            if (listeners.size === 0)
                this.subscribers.delete(runId);
        };
    }
    update(runId, patch, events, publishSnapshot = false) {
        const current = this.runs.get(runId);
        if (!current)
            throw new Error(`Run ${runId} not found.`);
        const partial = typeof patch === "function" ? patch(current) : patch;
        const next = {
            ...current,
            ...partial,
            updatedAt: new Date().toISOString(),
        };
        this.runs.set(runId, next);
        for (const event of events) {
            this.publish(runId, event);
        }
        if (publishSnapshot) {
            this.publish(runId, { type: "snapshot", runId, run: next });
        }
        return next;
    }
    publish(runId, event) {
        const listeners = this.subscribers.get(runId);
        if (!listeners || listeners.size === 0)
            return;
        const payload = event.type === "snapshot"
            ? { ...event, run: event.run ?? this.get(runId) ?? undefined }
            : event;
        for (const listener of listeners) {
            listener(payload);
        }
    }
}
export function isTerminalRunStatus(status) {
    return status === "succeeded" || status === "failed";
}
//# sourceMappingURL=run-store.js.map