import { type StateManifest } from "../models/runtime-state.js";
export { normalizeHookId, parseChapterSummariesMarkdown, parseCurrentStateFacts, parsePendingHooksMarkdown, } from "../utils/story-markdown.js";
export interface BootstrapStructuredStateResult {
    readonly createdFiles: ReadonlyArray<string>;
    readonly warnings: ReadonlyArray<string>;
    readonly manifest: StateManifest;
}
export declare function bootstrapStructuredStateFromMarkdown(params: {
    readonly bookDir: string;
    readonly fallbackChapter?: number;
}): Promise<BootstrapStructuredStateResult>;
export declare function rewriteStructuredStateFromMarkdown(params: {
    readonly bookDir: string;
    readonly fallbackChapter?: number;
}): Promise<BootstrapStructuredStateResult>;
export declare function resolveDurableStoryProgress(params: {
    readonly bookDir: string;
    readonly fallbackChapter?: number;
}): Promise<number>;
export declare function resolveContiguousChapterPrefix(chapterNumbers: ReadonlyArray<number>): number;
//# sourceMappingURL=state-bootstrap.d.ts.map