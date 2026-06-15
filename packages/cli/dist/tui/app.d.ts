import { type InteractionRuntimeTools } from "@actalk/inkos-core";
import { type TuiLocale } from "./i18n.js";
export interface TuiFrameState {
    readonly locale?: TuiLocale;
    readonly projectName: string;
    readonly activeBookTitle?: string;
    readonly automationMode: string;
    readonly status: string;
    readonly messages?: ReadonlyArray<string>;
    readonly events?: ReadonlyArray<string>;
}
export declare function renderTuiFrame(state: TuiFrameState): string;
export declare function processTuiInput(projectRoot: string, input: string, tools: InteractionRuntimeTools): Promise<{
    session: {
        events: {
            status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
            kind: string;
            timestamp: number;
            detail?: string | undefined;
            bookId?: string | undefined;
            chapterNumber?: number | undefined;
        }[];
        messages: {
            content: string;
            role: "system" | "user" | "assistant";
            timestamp: number;
        }[];
        sessionId: string;
        projectRoot: string;
        automationMode: "auto" | "semi" | "manual";
        activeBookId?: string | undefined;
        activeChapterNumber?: number | undefined;
        creationDraft?: {
            concept: string;
            missingFields: string[];
            readyToCreate: boolean;
            title?: string | undefined;
            platform?: string | undefined;
            genre?: string | undefined;
            targetChapters?: number | undefined;
            chapterWordCount?: number | undefined;
            language?: "zh" | "en" | undefined;
            protagonist?: string | undefined;
            authorIntent?: string | undefined;
            currentFocus?: string | undefined;
            volumeOutline?: string | undefined;
            blurb?: string | undefined;
            worldPremise?: string | undefined;
            settingNotes?: string | undefined;
            supportingCast?: string | undefined;
            conflictCore?: string | undefined;
            constraints?: string | undefined;
            nextQuestion?: string | undefined;
        } | undefined;
        pendingDecision?: {
            bookId: string;
            kind: string;
            summary: string;
            chapterNumber?: number | undefined;
        } | undefined;
        currentExecution?: {
            status: "completed" | "planning" | "idle" | "composing" | "writing" | "assessing" | "repairing" | "persisting" | "waiting_human" | "blocked" | "failed";
            bookId?: string | undefined;
            chapterNumber?: number | undefined;
            stageLabel?: string | undefined;
        } | undefined;
    };
    request: {
        intent: "chat" | "develop_book" | "show_book_draft" | "create_book" | "discard_book_draft" | "list_books" | "select_book" | "continue_book" | "write_next" | "pause_book" | "resume_book" | "revise_chapter" | "rewrite_chapter" | "patch_chapter_text" | "edit_truth" | "rename_entity" | "update_focus" | "update_author_intent" | "explain_status" | "explain_failure" | "export_book" | "switch_mode";
        title?: string | undefined;
        platform?: string | undefined;
        genre?: string | undefined;
        targetChapters?: number | undefined;
        chapterWordCount?: number | undefined;
        language?: "zh" | "en" | undefined;
        protagonist?: string | undefined;
        authorIntent?: string | undefined;
        currentFocus?: string | undefined;
        volumeOutline?: string | undefined;
        bookId?: string | undefined;
        chapterNumber?: number | undefined;
        blurb?: string | undefined;
        worldPremise?: string | undefined;
        settingNotes?: string | undefined;
        supportingCast?: string | undefined;
        conflictCore?: string | undefined;
        constraints?: string | undefined;
        fileName?: string | undefined;
        format?: "txt" | "md" | "epub" | undefined;
        approvedOnly?: boolean | undefined;
        outputPath?: string | undefined;
        oldValue?: string | undefined;
        newValue?: string | undefined;
        targetText?: string | undefined;
        replacementText?: string | undefined;
        instruction?: string | undefined;
        mode?: "auto" | "semi" | "manual" | undefined;
    };
    responseText?: string;
    details?: Readonly<Record<string, unknown>>;
}>;
export declare function launchTui(projectRoot: string, toolsOverride?: InteractionRuntimeTools): Promise<void>;
//# sourceMappingURL=app.d.ts.map