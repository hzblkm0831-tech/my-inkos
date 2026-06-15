import type { ChapterMeta } from "../models/chapter.js";
import { type TruthAuthority } from "./truth-authority.js";
export type EditRequest = {
    readonly kind: "entity-rename";
    readonly bookId: string;
    readonly entityType: "protagonist" | "character" | "location" | "organization";
    readonly oldValue: string;
    readonly newValue: string;
} | {
    readonly kind: "chapter-rewrite";
    readonly bookId: string;
    readonly chapterNumber: number;
    readonly instruction: string;
} | {
    readonly kind: "chapter-local-edit";
    readonly bookId: string;
    readonly chapterNumber: number;
    readonly instruction: string;
    readonly targetText?: string;
    readonly replacementText?: string;
} | {
    readonly kind: "truth-file-edit";
    readonly bookId: string;
    readonly fileName: string;
    readonly instruction: string;
} | {
    readonly kind: "focus-edit";
    readonly bookId: string;
    readonly instruction: string;
};
export interface PlannedEditTransaction {
    readonly transactionType: EditRequest["kind"];
    readonly bookId: string;
    readonly chapterNumber?: number;
    readonly truthAuthority?: TruthAuthority;
    readonly normalizedFileName?: string;
    readonly affectedScope: "chapter" | "downstream" | "future" | "book";
    readonly requiresTruthRebuild: boolean;
}
export interface EditExecutionDeps {
    readonly bookDir: (bookId: string) => string;
    readonly loadChapterIndex: (bookId: string) => Promise<ReadonlyArray<ChapterMeta>>;
    readonly saveChapterIndex: (bookId: string, index: ReadonlyArray<ChapterMeta>) => Promise<void>;
}
export interface ExecutedEditTransaction {
    readonly transactionType: EditRequest["kind"];
    readonly bookId: string;
    readonly chapterNumber?: number;
    readonly touchedFiles: ReadonlyArray<string>;
    readonly reviewRequired: boolean;
    readonly summary: string;
}
export declare function planEditTransaction(request: EditRequest): PlannedEditTransaction;
export declare function executeEditTransaction(deps: EditExecutionDeps, request: EditRequest): Promise<ExecutedEditTransaction>;
//# sourceMappingURL=edit-controller.d.ts.map