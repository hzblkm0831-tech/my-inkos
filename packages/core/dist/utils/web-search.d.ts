/**
 * Web search + URL fetch utilities.
 *
 * searchWeb(): Tavily API search (requires TAVILY_API_KEY env var).
 * fetchUrl(): Fetch a specific URL and return plain text.
 */
export interface SearchResult {
    readonly title: string;
    readonly url: string;
    readonly snippet: string;
}
/**
 * Search the web via Tavily API.
 * Requires TAVILY_API_KEY environment variable.
 * Throws if key is not set — caller should catch and fall back to regular chat.
 */
export declare function searchWeb(query: string, maxResults?: number): Promise<ReadonlyArray<SearchResult>>;
/**
 * Fetch a URL and return its text content.
 * HTML is stripped to plain text. Output is truncated to maxChars.
 */
export declare function fetchUrl(url: string, maxChars?: number): Promise<string>;
//# sourceMappingURL=web-search.d.ts.map