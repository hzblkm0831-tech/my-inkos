import { appendInteractionMessage, } from "@actalk/inkos-core";
export function createOptimisticUserMessageSession(session, input, timestamp = Date.now()) {
    return appendInteractionMessage(session, {
        role: "user",
        content: input,
        timestamp,
    });
}
export function appendStreamingAssistantChunk(session, chunk, timestamp = Date.now()) {
    if (!chunk) {
        return session;
    }
    const lastMessage = session.messages.at(-1);
    if (lastMessage?.role === "assistant" && lastMessage.timestamp === timestamp) {
        return {
            ...session,
            messages: session.messages.map((message, index) => index === session.messages.length - 1
                ? { ...message, content: message.content + chunk }
                : message),
        };
    }
    return appendInteractionMessage(session, {
        role: "assistant",
        content: chunk,
        timestamp,
    });
}
//# sourceMappingURL=chat-draft.js.map