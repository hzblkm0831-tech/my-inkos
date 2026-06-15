import type { LLMClient, LLMMessage, LLMResponse, OnStreamProgress } from "../llm/provider.js";
import type { Logger } from "../utils/logger.js";
export interface AgentContext {
    readonly client: LLMClient;
    readonly model: string;
    readonly projectRoot: string;
    readonly bookId?: string;
    readonly logger?: Logger;
    readonly onStreamProgress?: OnStreamProgress;
}
export declare abstract class BaseAgent {
    protected readonly ctx: AgentContext;
    constructor(ctx: AgentContext);
    protected get log(): Logger | undefined;
    protected chat(messages: ReadonlyArray<LLMMessage>, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<LLMResponse>;
    /**
     * Chat with web search enabled.
     * OpenAI: uses native web_search_options / web_search_preview.
     * Other providers: searches via Tavily API (TAVILY_API_KEY), injects results into prompt.
     */
    protected chatWithSearch(messages: ReadonlyArray<LLMMessage>, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<LLMResponse>;
    abstract get name(): string;
}
//# sourceMappingURL=base.d.ts.map