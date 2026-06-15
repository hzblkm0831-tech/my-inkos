import type { PipelineRunner, StateManager, BookConfig } from "../index.js";
import type { InteractionRuntimeTools } from "./runtime.js";
type PipelineLike = Pick<PipelineRunner, "writeNextChapter" | "reviseDraft"> & {
    readonly initBook?: (book: BookConfig, options?: {
        readonly externalContext?: string;
        readonly authorIntent?: string;
        readonly currentFocus?: string;
    }) => Promise<void>;
};
type StateLike = Pick<StateManager, "ensureControlDocuments" | "bookDir" | "loadBookConfig" | "loadChapterIndex" | "saveChapterIndex" | "listBooks">;
export declare function buildChapterFileLookup(files: ReadonlyArray<string>): ReadonlyMap<number, string>;
export declare function createInteractionToolsFromDeps(pipeline: PipelineLike, state: StateLike, hooks?: {
    readonly onChatTextDelta?: (text: string) => void;
    readonly getChatRequestOptions?: () => {
        readonly temperature?: number;
        readonly maxTokens?: number;
    };
}): InteractionRuntimeTools;
export {};
//# sourceMappingURL=project-tools.d.ts.map