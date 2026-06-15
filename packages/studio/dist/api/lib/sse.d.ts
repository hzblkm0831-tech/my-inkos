/**
 * SSE stream factory for run event streaming.
 * Ported from PR #96 (Te9ui1a) — typed ReadableStream with auto-close.
 */
import type { RunStreamEvent } from "../../shared/contracts.js";
export declare function createRunEventStream(initialEvent: RunStreamEvent, subscribe: (send: (event: RunStreamEvent) => void) => () => void, shouldClose: (event: RunStreamEvent) => boolean): Response;
//# sourceMappingURL=sse.d.ts.map