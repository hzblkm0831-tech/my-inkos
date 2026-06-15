/**
 * SSE stream factory for run event streaming.
 * Ported from PR #96 (Te9ui1a) — typed ReadableStream with auto-close.
 */
function encodeSse(event) {
    return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}
export function createRunEventStream(initialEvent, subscribe, shouldClose) {
    let unsubscribe = null;
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encodeSse(initialEvent));
            if (shouldClose(initialEvent)) {
                controller.close();
                return;
            }
            unsubscribe = subscribe((event) => {
                controller.enqueue(encodeSse(event));
                if (shouldClose(event)) {
                    unsubscribe?.();
                    unsubscribe = null;
                    controller.close();
                }
            });
        },
        cancel() {
            unsubscribe?.();
            unsubscribe = null;
        },
    });
    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache",
            connection: "keep-alive",
        },
    });
}
//# sourceMappingURL=sse.js.map