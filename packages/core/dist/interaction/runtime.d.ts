import type { AutomationMode } from "./modes.js";
import type { InteractionRequest } from "./intents.js";
import type { InteractionSession } from "./session.js";
type ReviseMode = "local-fix" | "rewrite";
export interface InteractionRuntimeTools {
    readonly listBooks: () => Promise<ReadonlyArray<string>>;
    readonly developBookDraft?: (input: string, existingDraft?: InteractionSession["creationDraft"]) => Promise<unknown>;
    readonly createBook?: (input: {
        readonly title: string;
        readonly genre?: string;
        readonly platform?: string;
        readonly language?: "zh" | "en";
        readonly chapterWordCount?: number;
        readonly targetChapters?: number;
        readonly blurb?: string;
        readonly worldPremise?: string;
        readonly settingNotes?: string;
        readonly protagonist?: string;
        readonly supportingCast?: string;
        readonly conflictCore?: string;
        readonly volumeOutline?: string;
        readonly constraints?: string;
        readonly authorIntent?: string;
        readonly currentFocus?: string;
    }) => Promise<unknown>;
    readonly exportBook?: (bookId: string, options: {
        readonly format?: "txt" | "md" | "epub";
        readonly approvedOnly?: boolean;
        readonly outputPath?: string;
    }) => Promise<unknown>;
    readonly chat?: (input: string, options: {
        readonly bookId?: string;
        readonly automationMode: AutomationMode;
    }) => Promise<unknown>;
    readonly writeNextChapter: (bookId: string) => Promise<unknown>;
    readonly reviseDraft: (bookId: string, chapterNumber: number, mode: ReviseMode) => Promise<unknown>;
    readonly patchChapterText: (bookId: string, chapterNumber: number, targetText: string, replacementText: string) => Promise<unknown>;
    readonly renameEntity: (bookId: string, oldValue: string, newValue: string) => Promise<unknown>;
    readonly updateCurrentFocus: (bookId: string, content: string) => Promise<unknown>;
    readonly updateAuthorIntent: (bookId: string, content: string) => Promise<unknown>;
    readonly writeTruthFile: (bookId: string, fileName: string, content: string) => Promise<unknown>;
}
export interface InteractionRuntimeResult {
    readonly session: InteractionSession;
    readonly responseText?: string;
    readonly details?: Readonly<Record<string, unknown>>;
}
export declare function runInteractionRequest(params: {
    readonly session: InteractionSession;
    readonly request: InteractionRequest;
    readonly tools: InteractionRuntimeTools;
}): Promise<InteractionRuntimeResult>;
export {};
//# sourceMappingURL=runtime.d.ts.map