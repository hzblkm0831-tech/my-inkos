/**
 * Modified by Antigravity (AI Coding Assistant) on 2026-06-08
 * - Added `executeWithRetry` wrapper to chatCompletion and chatWithTools.
 * - Implemented exponential backoff retries for HTTP 429 / Rate Limit / Quota Exceeded errors.
 */
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
export function createStreamMonitor(onProgress, intervalMs = 30000) {
    let totalChars = 0;
    let chineseChars = 0;
    const startTime = Date.now();
    let timer;
    if (onProgress) {
        timer = setInterval(() => {
            onProgress({
                elapsedMs: Date.now() - startTime,
                totalChars,
                chineseChars,
                status: "streaming",
            });
        }, intervalMs);
    }
    return {
        onChunk(text) {
            totalChars += text.length;
            chineseChars += (text.match(/[\u4e00-\u9fff]/g) || []).length;
        },
        stop() {
            if (timer !== undefined) {
                clearInterval(timer);
                timer = undefined;
            }
            onProgress?.({
                elapsedMs: Date.now() - startTime,
                totalChars,
                chineseChars,
                status: "done",
            });
        },
    };
}
// === Factory ===
export function createLLMClient(config) {
    const defaults = {
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? 8192,
        maxTokensCap: config.maxTokens ?? null, // only cap when user explicitly set maxTokens
        thinkingBudget: config.thinkingBudget ?? 0,
        extra: config.extra ?? {},
    };
    const apiFormat = config.apiFormat ?? "chat";
    const stream = config.stream ?? true;
    if (config.provider === "anthropic") {
        // Anthropic SDK appends /v1/ internally — strip if user included it
        const baseURL = config.baseUrl.replace(/\/v1\/?$/, "");
        return {
            provider: "anthropic",
            apiFormat,
            stream,
            _anthropic: new Anthropic({ apiKey: config.apiKey, baseURL }),
            defaults,
        };
    }
    // openai or custom — both use OpenAI SDK
    const extraHeaders = config.headers ?? parseEnvHeaders();
    return {
        provider: "openai",
        apiFormat,
        stream,
        _openai: new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            ...(extraHeaders ? { defaultHeaders: extraHeaders } : {}),
        }),
        defaults,
    };
}
function parseEnvHeaders() {
    const raw = process.env.INKOS_LLM_HEADERS;
    if (!raw)
        return undefined;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch {
        // not JSON — treat as single "Key: Value" pair
        const idx = raw.indexOf(":");
        if (idx > 0) {
            return { [raw.slice(0, idx).trim()]: raw.slice(idx + 1).trim() };
        }
    }
    return undefined;
}
// === Partial Response (stream interrupted but usable content received) ===
export class PartialResponseError extends Error {
    partialContent;
    constructor(partialContent, cause) {
        super(`Stream interrupted after ${partialContent.length} chars: ${String(cause)}`);
        this.name = "PartialResponseError";
        this.partialContent = partialContent;
    }
}
/** Minimum chars to consider a partial response salvageable (Chinese ~2 chars/word → 500 chars ≈ 250 words) */
const MIN_SALVAGEABLE_CHARS = 500;
/** Keys managed by the provider layer — prevent extra from overriding them. */
const RESERVED_KEYS = new Set(["max_tokens", "temperature", "model", "messages", "stream"]);
function stripReservedKeys(extra) {
    const result = {};
    for (const [key, value] of Object.entries(extra)) {
        if (!RESERVED_KEYS.has(key))
            result[key] = value;
    }
    return result;
}
// === Fixed-Temperature Model Clamp ===
//
// 部分 thinking 模型（如 Moonshot kimi-k2.5、kimi-thinking-preview）强制要求
// temperature === 1，其他值会被 API 直接 400 拒绝。为让这类模型能和 inkos
// 已有的 per-call 温度调参（0.1 validator → 0.8 architect brainstorm）共存，
// 在 provider 层统一夹制：命中名单就把传入的 temperature 强制改成 1，并对
// 每个模型名打一次 warning 提示用户。
function requiresFixedTemperature(model) {
    const lower = model.toLowerCase();
    // kimi-k2.5 及其子变体（k2.5-preview 等），以及任何名字里带 "thinking" 的模型
    return lower.startsWith("kimi-k2.5") || lower.includes("thinking");
}
const warnedFixedTemperatureModels = new Set();
function clampTemperatureForModel(model, requested) {
    if (!requiresFixedTemperature(model))
        return requested;
    if (requested === 1)
        return 1;
    if (!warnedFixedTemperatureModels.has(model)) {
        warnedFixedTemperatureModels.add(model);
        console.warn(`[inkos] 模型 "${model}" 是 thinking 模型，强制 temperature=1（原请求值 ${requested}）`);
    }
    return 1;
}
// 仅测试用：清空 warning 去重集合。
export function __resetFixedTemperatureWarnings() {
    warnedFixedTemperatureModels.clear();
}
// === Error Wrapping ===
function wrapLLMError(error, context) {
    const msg = String(error);
    const ctxLine = context
        ? `\n  (baseUrl: ${context.baseUrl}, model: ${context.model})`
        : "";
    if (msg.includes("400")) {
        return new Error(`API 返回 400 (请求参数错误)。可能原因：\n` +
            `  1. 模型名称不正确（检查 INKOS_LLM_MODEL）\n` +
            `  2. 提供方不支持某些参数（如 max_tokens、stream）\n` +
            `  3. 消息格式不兼容（部分提供方不支持 system role）\n` +
            `  建议：检查提供方文档，确认该接口要求流式开启、流式关闭，还是根本不支持 stream${ctxLine}`);
    }
    if (msg.includes("403")) {
        return new Error(`API 返回 403 (请求被拒绝)。可能原因：\n` +
            `  1. API Key 无效或过期\n` +
            `  2. API 提供方的内容审查拦截了请求（公益/免费 API 常见）\n` +
            `  3. 账户余额不足\n` +
            `  建议：用 inkos doctor 测试 API 连通性，或换一个不限制内容的 API 提供方${ctxLine}`);
    }
    if (msg.includes("401")) {
        return new Error(`API 返回 401 (未授权)。请检查 .env 中的 INKOS_LLM_API_KEY 是否正确。${ctxLine}`);
    }
    if (msg.includes("429")) {
        return new Error(`API 返回 429 (请求过多)。请稍后重试，或检查 API 配额。${ctxLine}`);
    }
    if (msg.includes("Connection error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND") || msg.includes("fetch failed")) {
        return new Error(`无法连接到 API 服务。可能原因：\n` +
            `  1. baseUrl 地址不正确（当前：${context?.baseUrl ?? "未知"}）\n` +
            `  2. 网络不通或被防火墙拦截\n` +
            `  3. API 服务暂时不可用\n` +
            `  建议：检查 INKOS_LLM_BASE_URL 是否包含完整路径（如 /v1）`);
    }
    return error instanceof Error ? error : new Error(msg);
}
function wrapStreamRequiredError(streamError, syncError, context) {
    const ctxLine = context
        ? `\n  (baseUrl: ${context.baseUrl}, model: ${context.model})`
        : "";
    return new Error(`API 提供方要求使用流式请求（stream:true），不能回退到同步模式。` +
        `\n  这次失败不是模型名错误，而是前一次流式请求先失败了，随后同步回退又被提供方拒绝。` +
        `\n  建议：保持 stream:true，并检查该提供方/代理的 SSE 流是否稳定。` +
        `\n  原始流式错误：${String(streamError)}` +
        `\n  同步回退错误：${String(syncError)}${ctxLine}`);
}
// === Simple Chat (used by all agents via BaseAgent.chat()) ===
export class QuotaExhaustedError extends Error {
    constructor(message) {
        super(message);
        this.name = "QuotaExhaustedError";
    }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function executeWithRetry(fn, maxRetries = 5, initialDelay = 4000) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            attempt++;
            const errorStr = String(error);
            const isRateLimit = errorStr.includes("429") ||
                errorStr.includes("503") ||
                errorStr.includes("502") ||
                errorStr.includes("Rate limit") ||
                errorStr.includes("quota") ||
                errorStr.includes("too many requests") ||
                errorStr.includes("Quota exceeded") ||
                errorStr.includes("Stream interrupted") ||
                error.name === "PartialResponseError" ||
                error instanceof PartialResponseError;
            if (isRateLimit) {
                if (attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(2, attempt - 1);
                    console.warn(`[inkos] LLM 触发限流或连接中断，将在 ${delay / 1000} 秒后重试 (尝试 ${attempt}/${maxRetries})...`);
                    await sleep(delay);
                    continue;
                }
                else {
                    if (error instanceof PartialResponseError) {
                        console.warn(`[inkos] LLM 达到最大重试次数，降级返回已截断的局部响应 (${error.partialContent.length} 字符)`);
                        return {
                            content: error.partialContent,
                            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                        };
                    }
                    throw new QuotaExhaustedError(`LLM Quota Exceeded / Connection failed after ${maxRetries} retries: ${errorStr}`);
                }
            }
            throw error;
        }
    }
}
export async function chatCompletion(client, model, messages, options) {
    let attempt = 0;
    return executeWithRetry(async () => {
        attempt++;
        const useStream = client.stream && attempt === 1;
        const perCallMax = options?.maxTokens ?? client.defaults.maxTokens;
        const cap = client.defaults.maxTokensCap;
        const resolved = {
            temperature: clampTemperatureForModel(model, options?.temperature ?? client.defaults.temperature),
            maxTokens: cap !== null ? Math.min(perCallMax, cap) : perCallMax,
            extra: client.defaults.extra,
        };
        const onStreamProgress = options?.onStreamProgress;
        const onTextDelta = options?.onTextDelta;
        const errorCtx = { baseUrl: client._openai?.baseURL ?? "(anthropic)", model };
        try {
            if (client.provider === "anthropic") {
                return useStream
                    ? await chatCompletionAnthropic(client._anthropic, model, messages, resolved, client.defaults.thinkingBudget, onStreamProgress, onTextDelta)
                    : await chatCompletionAnthropicSync(client._anthropic, model, messages, resolved, client.defaults.thinkingBudget, onTextDelta);
            }
            if (client.apiFormat === "responses") {
                return useStream
                    ? await chatCompletionOpenAIResponses(client._openai, model, messages, resolved, options?.webSearch, onStreamProgress, onTextDelta)
                    : await chatCompletionOpenAIResponsesSync(client._openai, model, messages, resolved, options?.webSearch, onTextDelta);
            }
            return useStream
                ? await chatCompletionOpenAIChat(client._openai, model, messages, resolved, options?.webSearch, onStreamProgress, onTextDelta)
                : await chatCompletionOpenAIChatSync(client._openai, model, messages, resolved, options?.webSearch, onTextDelta);
        }
        catch (error) {
            // Auto-fallback: if streaming failed, retry with sync (many proxies don't support SSE)
            if (useStream && !(error instanceof PartialResponseError)) {
                const isStreamRelated = isLikelyStreamError(error);
                if (isStreamRelated) {
                    try {
                        if (client.provider === "anthropic") {
                            return await chatCompletionAnthropicSync(client._anthropic, model, messages, resolved, client.defaults.thinkingBudget);
                        }
                        if (client.apiFormat === "responses") {
                            return await chatCompletionOpenAIResponsesSync(client._openai, model, messages, resolved, options?.webSearch);
                        }
                        return await chatCompletionOpenAIChatSync(client._openai, model, messages, resolved, options?.webSearch);
                    }
                    catch (syncError) {
                        if (isStreamRequiredError(syncError)) {
                            throw wrapStreamRequiredError(error, syncError, errorCtx);
                        }
                        throw wrapLLMError(syncError, errorCtx);
                    }
                }
            }
            throw wrapLLMError(error, errorCtx);
        }
    });
}
function isLikelyStreamError(error) {
    const msg = String(error).toLowerCase();
    // Common indicators that streaming specifically is the problem:
    // - SSE parse errors, chunked transfer issues, content-type mismatches
    // - Some proxies return 400/415 when stream=true
    // - "stream" mentioned in error, or generic network errors during streaming
    return (msg.includes("stream") ||
        msg.includes("text/event-stream") ||
        msg.includes("chunked") ||
        msg.includes("unexpected end") ||
        msg.includes("premature close") ||
        msg.includes("terminated") ||
        msg.includes("econnreset") ||
        (msg.includes("400") && !msg.includes("content")));
}
function isStreamRequiredError(error) {
    const msg = String(error).toLowerCase();
    return (msg.includes("stream must be set to true") ||
        (msg.includes("stream") && msg.includes("must be set to true")) ||
        (msg.includes("stream") && msg.includes("required")));
}
// === Tool-calling Chat (used by agent loop) ===
export async function chatWithTools(client, model, messages, tools, options) {
    return executeWithRetry(async () => {
        try {
            const resolved = {
                temperature: clampTemperatureForModel(model, options?.temperature ?? client.defaults.temperature),
                maxTokens: options?.maxTokens ?? client.defaults.maxTokens,
            };
            // Tool-calling always uses streaming (only used by agent loop, not by writer/auditor)
            if (client.provider === "anthropic") {
                return await chatWithToolsAnthropic(client._anthropic, model, messages, tools, resolved, client.defaults.thinkingBudget);
            }
            if (client.apiFormat === "responses") {
                return await chatWithToolsOpenAIResponses(client._openai, model, messages, tools, resolved);
            }
            return await chatWithToolsOpenAIChat(client._openai, model, messages, tools, resolved);
        }
        catch (error) {
            throw wrapLLMError(error);
        }
    });
}
// === OpenAI Chat Completions API Implementation (default) ===
async function chatCompletionOpenAIChat(client, model, messages, options, webSearch, onStreamProgress, onTextDelta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
        ...(webSearch ? { web_search_options: { search_context_size: "medium" } } : {}),
        ...stripReservedKeys(options.extra),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await client.chat.completions.create(createParams);
    const chunks = [];
    let inputTokens = 0;
    let outputTokens = 0;
    const monitor = createStreamMonitor(onStreamProgress);
    let finishReasonReceived = false;
    try {
        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            const delta = choice?.delta?.content;
            if (delta) {
                chunks.push(delta);
                monitor.onChunk(delta);
                onTextDelta?.(delta);
            }
            if (choice?.finish_reason && choice.finish_reason !== "length") {
                finishReasonReceived = true;
            }
            if (chunk.usage) {
                inputTokens = chunk.usage.prompt_tokens ?? 0;
                outputTokens = chunk.usage.completion_tokens ?? 0;
            }
        }
    }
    catch (streamError) {
        monitor.stop();
        const partial = chunks.join("");
        if (partial.length >= MIN_SALVAGEABLE_CHARS) {
            throw new PartialResponseError(partial, streamError);
        }
        throw streamError;
    }
    finally {
        monitor.stop();
    }
    const content = chunks.join("");
    if (!content)
        throw new Error("LLM returned empty response from stream");
    if (!finishReasonReceived) {
        throw new PartialResponseError(content, new Error("Stream connection closed prematurely or truncated (no valid stop reason)"));
    }
    return {
        content,
        usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
        },
    };
}
async function chatCompletionOpenAIChatSync(client, model, messages, options, _webSearch, onTextDelta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncParams = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false,
        ...stripReservedKeys(options.extra),
    };
    const response = await client.chat.completions.create(syncParams);
    const choice = response.choices[0];
    const content = choice?.message?.content ?? "";
    if (!content)
        throw new Error("LLM returned empty response");
    onTextDelta?.(content);
    if (choice?.finish_reason === "length") {
        throw new PartialResponseError(content, new Error("Sync response truncated because it exceeded the maximum token limit (finish_reason = length)"));
    }
    return {
        content,
        usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
        },
    };
}
async function chatWithToolsOpenAIChat(client, model, messages, tools, options) {
    const openaiMessages = agentMessagesToOpenAIChat(messages);
    const openaiTools = tools.map((t) => ({
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    }));
    const stream = await client.chat.completions.create({
        model,
        messages: openaiMessages,
        tools: openaiTools,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: true,
    });
    let content = "";
    const toolCallMap = new Map();
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content)
            content += delta.content;
        if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
                const existing = toolCallMap.get(tc.index);
                if (existing) {
                    existing.arguments += tc.function?.arguments ?? "";
                }
                else {
                    toolCallMap.set(tc.index, {
                        id: tc.id ?? "",
                        name: tc.function?.name ?? "",
                        arguments: tc.function?.arguments ?? "",
                    });
                }
            }
        }
    }
    const toolCalls = [...toolCallMap.values()];
    return { content, toolCalls };
}
function agentMessagesToOpenAIChat(messages) {
    const result = [];
    for (const msg of messages) {
        if (msg.role === "system") {
            result.push({ role: "system", content: msg.content });
            continue;
        }
        if (msg.role === "user") {
            result.push({ role: "user", content: msg.content });
            continue;
        }
        if (msg.role === "assistant") {
            const assistantMsg = {
                role: "assistant",
                content: msg.content ?? null,
            };
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                assistantMsg.tool_calls = msg.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: { name: tc.name, arguments: tc.arguments },
                }));
            }
            result.push(assistantMsg);
            continue;
        }
        if (msg.role === "tool") {
            result.push({
                role: "tool",
                tool_call_id: msg.toolCallId,
                content: msg.content,
            });
        }
    }
    return result;
}
// === OpenAI Responses API Implementation (optional) ===
async function chatCompletionOpenAIResponses(client, model, messages, options, webSearch, onStreamProgress, onTextDelta) {
    const input = messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
    const tools = webSearch
        ? [{ type: "web_search_preview" }]
        : undefined;
    const stream = await client.responses.create({
        model,
        input,
        temperature: options.temperature,
        max_output_tokens: options.maxTokens,
        stream: true,
        ...(tools ? { tools } : {}),
    });
    const chunks = [];
    let inputTokens = 0;
    let outputTokens = 0;
    const monitor = createStreamMonitor(onStreamProgress);
    let completedReceived = false;
    try {
        for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
                chunks.push(event.delta);
                monitor.onChunk(event.delta);
                onTextDelta?.(event.delta);
            }
            if (event.type === "response.completed") {
                completedReceived = true;
                inputTokens = event.response.usage?.input_tokens ?? 0;
                outputTokens = event.response.usage?.output_tokens ?? 0;
            }
        }
    }
    catch (streamError) {
        monitor.stop();
        const partial = chunks.join("");
        if (partial.length >= MIN_SALVAGEABLE_CHARS) {
            throw new PartialResponseError(partial, streamError);
        }
        throw streamError;
    }
    finally {
        monitor.stop();
    }
    const content = chunks.join("");
    if (!content)
        throw new Error("LLM returned empty response from stream");
    if (!completedReceived) {
        throw new PartialResponseError(content, new Error("Stream connection closed prematurely before response.completed event"));
    }
    return {
        content,
        usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
        },
    };
}
async function chatCompletionOpenAIResponsesSync(client, model, messages, options, _webSearch, onTextDelta) {
    const input = messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
    const response = await client.responses.create({
        model,
        input,
        temperature: options.temperature,
        max_output_tokens: options.maxTokens,
        stream: false,
    });
    const content = response.output
        .filter((item) => item.type === "message")
        .flatMap((item) => item.content)
        .filter((block) => block.type === "output_text")
        .map((block) => block.text)
        .join("");
    if (!content)
        throw new Error("LLM returned empty response");
    onTextDelta?.(content);
    return {
        content,
        usage: {
            promptTokens: response.usage?.input_tokens ?? 0,
            completionTokens: response.usage?.output_tokens ?? 0,
            totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
        },
    };
}
async function chatWithToolsOpenAIResponses(client, model, messages, tools, options) {
    const input = agentMessagesToResponsesInput(messages);
    const responsesTools = tools.map((t) => ({
        type: "function",
        name: t.name,
        description: t.description,
        parameters: t.parameters,
        strict: false,
    }));
    const stream = await client.responses.create({
        model,
        input,
        tools: responsesTools,
        temperature: options.temperature,
        max_output_tokens: options.maxTokens,
        stream: true,
    });
    let content = "";
    const toolCalls = [];
    for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
            content += event.delta;
        }
        if (event.type === "response.output_item.done" && event.item.type === "function_call") {
            toolCalls.push({
                id: event.item.call_id,
                name: event.item.name,
                arguments: event.item.arguments,
            });
        }
    }
    return { content, toolCalls };
}
function agentMessagesToResponsesInput(messages) {
    const result = [];
    for (const msg of messages) {
        if (msg.role === "system") {
            result.push({ role: "system", content: msg.content });
            continue;
        }
        if (msg.role === "user") {
            result.push({ role: "user", content: msg.content });
            continue;
        }
        if (msg.role === "assistant") {
            if (msg.content) {
                result.push({ role: "assistant", content: msg.content });
            }
            if (msg.toolCalls) {
                for (const tc of msg.toolCalls) {
                    result.push({
                        type: "function_call",
                        call_id: tc.id,
                        name: tc.name,
                        arguments: tc.arguments,
                    });
                }
            }
            continue;
        }
        if (msg.role === "tool") {
            result.push({
                type: "function_call_output",
                call_id: msg.toolCallId,
                output: msg.content,
            });
        }
    }
    return result;
}
// === Anthropic Implementation ===
async function chatCompletionAnthropic(client, model, messages, options, thinkingBudget = 0, onStreamProgress, onTextDelta) {
    const systemText = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const stream = await client.messages.create({
        model,
        ...(systemText ? { system: systemText } : {}),
        messages: nonSystem.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        ...(thinkingBudget > 0
            ? { thinking: { type: "enabled", budget_tokens: thinkingBudget } }
            : { temperature: options.temperature }),
        max_tokens: options.maxTokens,
        stream: true,
    });
    const chunks = [];
    let inputTokens = 0;
    let outputTokens = 0;
    const monitor = createStreamMonitor(onStreamProgress);
    let completedReceived = false;
    try {
        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                chunks.push(event.delta.text);
                monitor.onChunk(event.delta.text);
                onTextDelta?.(event.delta.text);
            }
            if (event.type === "message_start") {
                inputTokens = event.message.usage?.input_tokens ?? 0;
            }
            if (event.type === "message_delta") {
                outputTokens = (event.usage?.output_tokens) ?? 0;
            }
            if (event.type === "message_stop") {
                completedReceived = true;
            }
        }
    }
    catch (streamError) {
        monitor.stop();
        const partial = chunks.join("");
        if (partial.length >= MIN_SALVAGEABLE_CHARS) {
            throw new PartialResponseError(partial, streamError);
        }
        throw streamError;
    }
    finally {
        monitor.stop();
    }
    const content = chunks.join("");
    if (!content)
        throw new Error("LLM returned empty response from stream");
    if (!completedReceived) {
        throw new PartialResponseError(content, new Error("Stream connection closed prematurely before message_stop event"));
    }
    return {
        content,
        usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
        },
    };
}
async function chatCompletionAnthropicSync(client, model, messages, options, thinkingBudget = 0, onTextDelta) {
    const systemText = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const response = await client.messages.create({
        model,
        ...(systemText ? { system: systemText } : {}),
        messages: nonSystem.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        ...(thinkingBudget > 0
            ? { thinking: { type: "enabled", budget_tokens: thinkingBudget } }
            : { temperature: options.temperature }),
        max_tokens: options.maxTokens,
    });
    const content = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
    if (!content)
        throw new Error("LLM returned empty response");
    onTextDelta?.(content);
    return {
        content,
        usage: {
            promptTokens: response.usage?.input_tokens ?? 0,
            completionTokens: response.usage?.output_tokens ?? 0,
            totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
        },
    };
}
async function chatWithToolsAnthropic(client, model, messages, tools, options, thinkingBudget = 0) {
    const systemText = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const anthropicMessages = agentMessagesToAnthropic(nonSystem);
    const anthropicTools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
    }));
    const stream = await client.messages.create({
        model,
        ...(systemText ? { system: systemText } : {}),
        messages: anthropicMessages,
        tools: anthropicTools,
        ...(thinkingBudget > 0
            ? { thinking: { type: "enabled", budget_tokens: thinkingBudget } }
            : { temperature: options.temperature }),
        max_tokens: options.maxTokens,
        stream: true,
    });
    let content = "";
    const toolCalls = [];
    let currentBlock = null;
    for await (const event of stream) {
        if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
            currentBlock = {
                id: event.content_block.id,
                name: event.content_block.name,
                input: "",
            };
        }
        if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
                content += event.delta.text;
            }
            if (event.delta.type === "input_json_delta" && currentBlock) {
                currentBlock.input += event.delta.partial_json;
            }
        }
        if (event.type === "content_block_stop" && currentBlock) {
            toolCalls.push({
                id: currentBlock.id,
                name: currentBlock.name,
                arguments: currentBlock.input,
            });
            currentBlock = null;
        }
    }
    return { content, toolCalls };
}
function agentMessagesToAnthropic(messages) {
    const result = [];
    for (const msg of messages) {
        if (msg.role === "system")
            continue;
        if (msg.role === "user") {
            result.push({ role: "user", content: msg.content });
            continue;
        }
        if (msg.role === "assistant") {
            const blocks = [];
            if (msg.content) {
                blocks.push({ type: "text", text: msg.content });
            }
            if (msg.toolCalls) {
                for (const tc of msg.toolCalls) {
                    blocks.push({
                        type: "tool_use",
                        id: tc.id,
                        name: tc.name,
                        input: JSON.parse(tc.arguments),
                    });
                }
            }
            if (blocks.length === 0) {
                blocks.push({ type: "text", text: "" });
            }
            result.push({ role: "assistant", content: blocks });
            continue;
        }
        if (msg.role === "tool") {
            const toolResult = {
                type: "tool_result",
                tool_use_id: msg.toolCallId,
                content: msg.content,
            };
            // Merge consecutive tool results into one user message (Anthropic requires alternating roles)
            const prev = result[result.length - 1];
            if (prev && prev.role === "user" && Array.isArray(prev.content)) {
                prev.content.push(toolResult);
            }
            else {
                result.push({ role: "user", content: [toolResult] });
            }
        }
    }
    return result;
}
//# sourceMappingURL=provider.js.map