import { PipelineRunner, StateManager, type InteractionRuntimeTools } from "@actalk/inkos-core";
type CliPipelineLike = Pick<PipelineRunner, "writeNextChapter" | "reviseDraft">;
type CliStateLike = Pick<StateManager, "ensureControlDocuments" | "bookDir" | "loadBookConfig" | "loadChapterIndex" | "saveChapterIndex" | "listBooks">;
type CliInteractionToolHooks = {
    readonly onChatTextDelta?: (text: string) => void;
    readonly getChatRequestOptions?: () => {
        readonly temperature?: number;
        readonly maxTokens?: number;
    };
};
export declare function createCliInteractionToolsFromDeps(pipeline: CliPipelineLike, state: CliStateLike, hooks?: CliInteractionToolHooks): InteractionRuntimeTools;
export declare function createInteractionToolsFromDepsCompat(_projectRoot: string, pipeline: CliPipelineLike, state: CliStateLike, hooks?: CliInteractionToolHooks): InteractionRuntimeTools;
export { createInteractionToolsFromDepsCompat as createInteractionToolsFromDeps };
export declare function createInteractionTools(projectRoot: string, hooks?: CliInteractionToolHooks): Promise<InteractionRuntimeTools>;
//# sourceMappingURL=tools.d.ts.map