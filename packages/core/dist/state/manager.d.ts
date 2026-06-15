import type { BookConfig } from "../models/book.js";
import type { ChapterMeta } from "../models/chapter.js";
export declare class StateManager {
    private readonly projectRoot;
    constructor(projectRoot: string);
    private static defaultAuthorIntent;
    private static defaultCurrentFocus;
    ensureControlDocuments(bookId: string, authorIntent?: string): Promise<void>;
    ensureControlDocumentsAt(bookDir: string, language: "zh" | "en", authorIntent?: string): Promise<void>;
    loadControlDocuments(bookId: string): Promise<{
        authorIntent: string;
        currentFocus: string;
        runtimeDir: string;
    }>;
    private resolveControlDocumentLanguage;
    acquireBookLock(bookId: string): Promise<() => Promise<void>>;
    private extractLockPid;
    private isProcessAlive;
    get booksDir(): string;
    bookDir(bookId: string): string;
    stateDir(bookId: string): string;
    loadProjectConfig(): Promise<Record<string, unknown>>;
    saveProjectConfig(config: Record<string, unknown>): Promise<void>;
    loadBookConfig(bookId: string): Promise<BookConfig>;
    saveBookConfig(bookId: string, config: BookConfig): Promise<void>;
    saveBookConfigAt(bookDir: string, config: BookConfig): Promise<void>;
    ensureRuntimeState(bookId: string, fallbackChapter?: number): Promise<void>;
    listBooks(): Promise<ReadonlyArray<string>>;
    getNextChapterNumber(bookId: string): Promise<number>;
    getPersistedChapterCount(bookId: string): Promise<number>;
    loadChapterIndex(bookId: string): Promise<ReadonlyArray<ChapterMeta>>;
    saveChapterIndex(bookId: string, index: ReadonlyArray<ChapterMeta>): Promise<void>;
    saveChapterIndexAt(bookDir: string, index: ReadonlyArray<ChapterMeta>): Promise<void>;
    snapshotState(bookId: string, chapterNumber: number): Promise<void>;
    snapshotStateAt(bookDir: string, chapterNumber: number): Promise<void>;
    isCompleteBookDirectory(bookDir: string): Promise<boolean>;
    restoreState(bookId: string, chapterNumber: number): Promise<boolean>;
    /**
     * Roll back state to the snapshot at `targetChapter`, removing all chapters
     * after it and their associated files (chapter markdown, snapshots, runtime).
     * Used by review reject to undo a bad chapter and everything that followed.
     *
     * Returns the list of chapter numbers that were discarded.
     */
    rollbackToChapter(bookId: string, targetChapter: number): Promise<ReadonlyArray<number>>;
    private writeIfMissing;
}
//# sourceMappingURL=manager.d.ts.map