import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { appendInteractionMessage, processProjectInteractionInput, routeNaturalLanguageIntent, } from "@actalk/inkos-core";
import { Box, Text, useApp, useInput } from "ink";
import { describeActivityState } from "./activity-state.js";
import { resolveComposerCaretState } from "./composer-caret.js";
import { resolveChatDepthProfile } from "./chat-depth.js";
import { appendStreamingAssistantChunk, createOptimisticUserMessageSession } from "./chat-draft.js";
import { renderComposerDisplay } from "./composer-display.js";
import { renderMarkdown } from "./markdown.js";
import { formatTuiResult } from "./output.js";
import { buildDashboardViewModel } from "./dashboard-model.js";
import { buildInputHistory, moveHistoryCursor } from "./input-history.js";
import { formatModeLabel, getTuiCopy, normalizeStageLabel } from "./i18n.js";
import { loadProjectSession, persistProjectSession, resolveSessionActiveBook } from "./session-store.js";
import { classifyLocalTuiCommand, parseDepthCommand } from "./local-commands.js";
import { applySlashSuggestion, getNextSlashSelection, getSlashSuggestions, SLASH_COMMANDS, } from "./slash-autocomplete.js";
import { WARM_ACCENT, WARM_BORDER, WARM_MUTED, WARM_REPLY, STATUS_SUCCESS, STATUS_ERROR, STATUS_ACTIVE, STATUS_IDLE, ROLE_USER, ROLE_SYSTEM, isAppleTerminal, } from "./theme.js";
export function InkTuiDashboard(props) {
    const copy = getTuiCopy(props.locale);
    const model = buildDashboardViewModel({
        copy,
        projectName: props.projectName,
        activeBookTitle: props.activeBookTitle,
        modelLabel: props.modelLabel,
        depthLabel: props.depthLabel,
        session: props.session,
        isSubmitting: props.isSubmitting,
        lastError: props.lastError,
        sinceTimestamp: props.sinceTimestamp,
        scrollOffset: props.scrollOffset,
    });
    const activeAccent = props.isSubmitting ? WARM_ACCENT : statusColor(model.executionStatus);
    const composer = renderComposerDisplay(props.inputValue, model.composerPlaceholder, props.showComposerCursor ?? false);
    const separatorWidth = Math.max(20, (process.stdout.columns ?? 60) - 8);
    const thinRule = "─".repeat(separatorWidth);
    return (_jsxs(Box, { flexDirection: "column", width: "100%", paddingX: 2, children: [_jsx(Text, { color: WARM_MUTED, children: model.headerLine }), _jsx(Text, { color: WARM_BORDER, children: thinRule }), _jsx(Box, { flexDirection: "column", marginTop: 1, flexGrow: 1, children: model.messageRows.length > 0 ? (model.messageRows.map((row) => _jsx(ConversationRow, { row: row }, row.key))) : (_jsx(Box, { marginY: 1, children: _jsxs(Text, { color: WARM_MUTED, italic: true, children: ["  ", copy.composer.emptyConversation] }) })) }), _jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: WARM_BORDER, children: thinRule }), _jsxs(Box, { marginTop: 1, children: [_jsx(ExecutionBadge, { status: model.executionStatus, color: activeAccent }), _jsxs(Text, { color: activeAccent, children: [" ", model.statusPrimaryLine] })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", width: "100%", borderStyle: "round", borderColor: props.isSubmitting ? STATUS_ACTIVE : WARM_BORDER, paddingX: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: props.isSubmitting ? STATUS_ACTIVE : WARM_ACCENT, bold: true, children: ["\u203A", " "] }), composer.textBeforeCursor ? (_jsx(Text, { color: composer.isPlaceholder ? WARM_MUTED : WARM_REPLY, children: composer.textBeforeCursor })) : null, composer.cursor ? (_jsx(Text, { color: props.isSubmitting ? STATUS_ACTIVE : WARM_ACCENT, children: composer.cursor })) : null, composer.textAfterCursor ? (_jsx(Text, { color: composer.isPlaceholder ? WARM_MUTED : WARM_REPLY, children: composer.textAfterCursor })) : null] }), props.slashSuggestions && props.slashSuggestions.length > 0 ? (_jsx(Box, { flexDirection: "column", marginTop: 1, borderTop: true, borderColor: WARM_BORDER, children: props.slashSuggestions.slice(0, 6).map((suggestion, index) => {
                                    const isSelected = index === (props.selectedSlashIndex ?? 0);
                                    return (_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? WARM_ACCENT : WARM_BORDER, children: isSelected ? "› " : "  " }), _jsx(Text, { color: isSelected ? WARM_REPLY : WARM_MUTED, bold: isSelected, children: suggestion })] }, suggestion));
                                }) })) : null] })] })] }));
}
export function InkTuiApp(props) {
    const { exit } = useApp();
    const copy = getTuiCopy(props.locale);
    const [session, setSession] = useState(props.initialSession);
    const [inputValue, setInputValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastError, setLastError] = useState();
    const [sinceTimestamp, setSinceTimestamp] = useState();
    const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [historyState, setHistoryState] = useState({
        cursor: null,
        draft: "",
    });
    const [activityIntent, setActivityIntent] = useState("unknown");
    const [activityFrameIndex, setActivityFrameIndex] = useState(0);
    const [chatDepth, setChatDepth] = useState("normal");
    const assistantDraftTimestampRef = useRef(null);
    const submitLockRef = useRef(false);
    const slashSuggestions = getSlashSuggestions(inputValue, SLASH_COMMANDS);
    const inputHistory = buildInputHistory(session.messages);
    const activity = describeActivityState(activityIntent, copy);
    const chatDepthProfile = resolveChatDepthProfile(chatDepth);
    const composerCaret = resolveComposerCaretState({
        inputValue,
        isSubmitting,
        blinkTick: 0,
    });
    useEffect(() => {
        if (!isSubmitting) {
            setActivityFrameIndex(0);
            return;
        }
        const timer = setInterval(() => {
            setActivityFrameIndex((current) => (current + 1) % activity.frames.length);
        }, activity.intervalMs);
        return () => clearInterval(timer);
    }, [activity.frames.length, activity.intervalMs, isSubmitting]);
    if (props.chatStreamBridge) {
        props.chatStreamBridge.getChatRequestOptions = () => ({
            temperature: chatDepthProfile.temperature,
            maxTokens: chatDepthProfile.maxTokens,
        });
    }
    props.chatStreamBridge && (props.chatStreamBridge.onTextDelta = (text) => {
        const timestamp = assistantDraftTimestampRef.current;
        if (timestamp === null) {
            return;
        }
        setSession((current) => appendStreamingAssistantChunk(current, text, timestamp));
    });
    useInput((_input, key) => {
        if (key.escape) {
            exit();
            return;
        }
        if (slashSuggestions.length > 0 && key.tab) {
            setInputValue(applySlashSuggestion(inputValue, slashSuggestions, selectedSlashIndex));
            setSelectedSlashIndex(0);
            return;
        }
        if (key.backspace || key.delete) {
            setInputValue((current) => {
                // Use Intl.Segmenter for grapheme-aware backspace (handles CJK, emoji, etc.)
                const segments = [...new Intl.Segmenter().segment(current)];
                segments.pop();
                return segments.map((s) => s.segment).join("");
            });
            setSelectedSlashIndex(0);
            return;
        }
        if (slashSuggestions.length > 0 && key.downArrow) {
            setSelectedSlashIndex((current) => getNextSlashSelection(current, slashSuggestions.length, "down"));
            return;
        }
        if (slashSuggestions.length > 0 && key.upArrow) {
            setSelectedSlashIndex((current) => getNextSlashSelection(current, slashSuggestions.length, "up"));
            return;
        }
        // Page Up / Page Down for conversation scrolling
        // Raw sequences: Page Up = \x1b[5~ , Page Down = \x1b[6~
        if (_input === "\x1b[5~") {
            const maxOffset = Math.max(0, session.messages.length - 4);
            setScrollOffset((cur) => Math.min(maxOffset, cur + 3));
            return;
        }
        if (_input === "\x1b[6~") {
            setScrollOffset((cur) => Math.max(0, cur - 3));
            return;
        }
        if (key.downArrow) {
            const next = moveHistoryCursor(inputHistory, historyState, inputValue, "down");
            setHistoryState(next.state);
            setInputValue(next.value);
            return;
        }
        if (key.upArrow) {
            const next = moveHistoryCursor(inputHistory, historyState, inputValue, "up");
            setHistoryState(next.state);
            setInputValue(next.value);
            return;
        }
        if (key.return) {
            void handleSubmit(inputValue);
            return;
        }
        if (_input && !_input.includes("\r") && !_input.includes("\n") && !key.ctrl && !key.meta) {
            setInputValue((current) => current + _input);
            setSelectedSlashIndex(0);
        }
    });
    const appendSystemNote = (content) => {
        setLastError(undefined);
        setSession((current) => appendInteractionMessage(current, {
            role: "system",
            content,
            timestamp: Date.now(),
        }));
    };
    const handleSubmit = async (rawValue) => {
        const input = rawValue.trim();
        if (!input || isSubmitting || submitLockRef.current) {
            return;
        }
        submitLockRef.current = true;
        try {
            const localCommand = classifyLocalTuiCommand(input);
            const depthCommand = parseDepthCommand(input);
            if (localCommand) {
                setInputValue("");
                if (localCommand === "quit") {
                    exit();
                    return;
                }
                if (localCommand === "help") {
                    appendSystemNote(copy.notes.help);
                    return;
                }
                if (localCommand === "status") {
                    const stage = normalizeStageLabel(session.currentExecution?.stageLabel ?? session.currentExecution?.status ?? "idle", copy);
                    appendSystemNote(copy.notes.status(stage, formatModeLabel(session.automationMode, copy)));
                    return;
                }
                if (localCommand === "clear") {
                    setLastError(undefined);
                    setSinceTimestamp(Date.now());
                    return;
                }
                if (localCommand === "config") {
                    appendSystemNote(copy.notes.config);
                    return;
                }
            }
            if (depthCommand) {
                setInputValue("");
                setChatDepth(depthCommand);
                appendSystemNote(copy.notes.depthSet(copy.depthLabels[depthCommand]));
                return;
            }
            const activeBookId = await resolveSessionActiveBook(props.projectRoot, session);
            const routed = routeNaturalLanguageIntent(input, {
                activeBookId,
                hasCreationDraft: Boolean(session.creationDraft),
                hasFailed: session.currentExecution?.status === "failed",
            });
            const userTimestamp = Date.now();
            const assistantDraftTimestamp = routed.intent === "chat" ? userTimestamp + 1 : null;
            assistantDraftTimestampRef.current = assistantDraftTimestamp;
            setActivityIntent(routed.intent);
            setIsSubmitting(true);
            setLastError(undefined);
            setInputValue("");
            setScrollOffset(0);
            setHistoryState({ cursor: null, draft: "" });
            setSession((current) => createOptimisticUserMessageSession(current, input, userTimestamp));
            const result = await processProjectInteractionInput({
                projectRoot: props.projectRoot,
                input,
                tools: props.tools,
                activeBookId,
            });
            const summary = formatTuiResult({
                intent: result.request.intent,
                status: result.session.currentExecution?.status ?? "completed",
                bookId: result.session.activeBookId,
                mode: result.request.mode,
                responseText: result.responseText,
                locale: props.locale,
            });
            const nextSession = appendInteractionMessage(result.session, {
                role: "assistant",
                content: summary,
                timestamp: Date.now(),
            });
            await persistProjectSession(props.projectRoot, nextSession);
            setSession(nextSession);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const failedSession = await loadProjectSession(props.projectRoot);
            setSession(failedSession);
            setLastError(message);
        }
        finally {
            assistantDraftTimestampRef.current = null;
            setIsSubmitting(false);
            setActivityIntent("unknown");
            submitLockRef.current = false;
        }
    };
    const activitySession = isSubmitting
        ? {
            ...session,
            currentExecution: {
                status: "planning",
                bookId: session.activeBookId,
                chapterNumber: session.activeChapterNumber,
                stageLabel: `${activity.label} ${activity.frames[activityFrameIndex] ?? ""}`.trim(),
            },
        }
        : session;
    return (_jsx(InkTuiDashboard, { locale: props.locale, projectName: props.projectName, activeBookTitle: activitySession.activeBookId, modelLabel: props.modelLabel, depthLabel: copy.depthLabels[chatDepth], session: activitySession, inputValue: inputValue, isSubmitting: isSubmitting, sinceTimestamp: sinceTimestamp, lastError: lastError, slashSuggestions: slashSuggestions, selectedSlashIndex: selectedSlashIndex, showComposerCursor: composerCaret.visible, scrollOffset: scrollOffset, onInputChange: (value) => {
            setInputValue(value);
            setSelectedSlashIndex(0);
            setHistoryState((current) => current.cursor === null ? current : { cursor: null, draft: value });
        }, onSubmit: (value) => {
            void handleSubmit(value);
        } }));
}
function ConversationRow(props) {
    const { role, content } = props.row;
    // Terminal.app: use the same simple layout as the main branch to avoid
    // triggering CoreGraphics crashes from complex Box nesting + ANSI codes.
    if (isAppleTerminal) {
        const prefix = role === "user" ? "│ " : role === "system" ? "· " : "◆ ";
        const color = role === "user" ? ROLE_USER : role === "system" ? ROLE_SYSTEM : WARM_REPLY;
        return (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: role === "assistant" ? WARM_ACCENT : color, children: prefix }), _jsx(Text, { color: color, children: content })] }));
    }
    if (role === "user") {
        return (_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: ROLE_USER, children: "\u2502" }) }), _jsx(Box, { flexDirection: "column", flexShrink: 1, children: _jsx(Text, { color: ROLE_USER, children: content }) })] }));
    }
    if (role === "system") {
        return (_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: ROLE_SYSTEM, children: "\u00B7" }) }), _jsx(Box, { flexDirection: "column", flexShrink: 1, children: _jsx(Text, { color: ROLE_SYSTEM, children: content }) })] }));
    }
    // assistant — render markdown (bold, tables, code, etc.)
    return (_jsxs(Box, { flexDirection: "row", marginBottom: 1, children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: WARM_ACCENT, children: "\u25C6" }) }), _jsx(Box, { flexDirection: "column", flexShrink: 1, children: _jsx(Text, { color: WARM_REPLY, children: renderMarkdown(content) }) })] }));
}
function ExecutionBadge(props) {
    const icon = statusIcon(props.status);
    return (_jsx(Text, { color: props.color ?? statusColor(props.status), bold: true, children: icon }));
}
function statusIcon(status) {
    switch (status) {
        case "completed":
            return "✓";
        case "failed":
            return "✗";
        case "blocked":
        case "waiting_human":
            return "◈";
        case "writing":
            return "✎";
        case "planning":
        case "composing":
            return "◇";
        case "repairing":
        case "persisting":
            return "◉";
        default:
            return "●";
    }
}
function MutedText(props) {
    return _jsx(Text, { color: WARM_MUTED, children: props.children });
}
function messageColor(role) {
    switch (role) {
        case "user":
            return WARM_MUTED;
        case "assistant":
            return WARM_REPLY;
        case "system":
            return WARM_ACCENT;
        default:
            return WARM_REPLY;
    }
}
function statusColor(status) {
    switch (status) {
        case "completed":
            return STATUS_SUCCESS;
        case "failed":
            return STATUS_ERROR;
        case "blocked":
        case "waiting_human":
            return WARM_ACCENT;
        case "writing":
        case "repairing":
        case "planning":
        case "composing":
        case "persisting":
            return STATUS_ACTIVE;
        default:
            return STATUS_IDLE;
    }
}
//# sourceMappingURL=dashboard.js.map