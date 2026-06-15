import { chatCompletion } from "../llm/provider.js";
import { searchWeb, fetchUrl } from "../utils/web-search.js";
export class BaseAgent {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    get log() {
        return this.ctx.logger;
    }
    async chat(messages, options) {
        return chatCompletion(this.ctx.client, this.ctx.model, messages, {
            ...options,
            onStreamProgress: this.ctx.onStreamProgress,
        });
    }
    /**
     * Chat with web search enabled.
     * OpenAI: uses native web_search_options / web_search_preview.
     * Other providers: searches via Tavily API (TAVILY_API_KEY), injects results into prompt.
     */
    async chatWithSearch(messages, options) {
        // OpenAI has native search — use it directly
        if (this.ctx.client.provider === "openai") {
            return chatCompletion(this.ctx.client, this.ctx.model, messages, {
                ...options,
                webSearch: true,
                onStreamProgress: this.ctx.onStreamProgress,
            });
        }
        // Other providers: self-hosted search → inject results into prompt
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) {
            return this.chat(messages, options);
        }
        try {
            // Extract search query from user message (first 200 chars)
            const query = lastUserMsg.content.slice(0, 200);
            this.log?.info(`[search] Searching: ${query.slice(0, 60)}...`);
            const results = await searchWeb(query, 3);
            if (results.length === 0) {
                this.log?.warn("[search] No results found, falling back to regular chat");
                return this.chat(messages, options);
            }
            // Fetch top result for full content
            let fullContent = "";
            try {
                fullContent = await fetchUrl(results[0].url, 4000);
            }
            catch {
                // Fetch failed, use snippets only
            }
            const searchContext = [
                "## Web Search Results\n",
                ...results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`),
                ...(fullContent ? [`\n## Full Content (Top Result)\n${fullContent}`] : []),
            ].join("\n");
            // Inject search results before the last user message
            const augmentedMessages = messages.map((m) => m === lastUserMsg
                ? { ...m, content: `${searchContext}\n\n---\n\n${m.content}` }
                : m);
            return this.chat(augmentedMessages, options);
        }
        catch (e) {
            this.log?.warn(`[search] Search failed: ${e}, falling back to regular chat`);
            return this.chat(messages, options);
        }
    }
}
//# sourceMappingURL=base.js.map