import type { Platform } from "@actalk/inkos-core";
export interface StudioCreateBookBody {
    readonly title: string;
    readonly genre: string;
    readonly language?: string;
    readonly platform?: string;
    readonly chapterWordCount?: number;
    readonly targetChapters?: number;
}
export interface StudioBookConfigDraft {
    readonly id: string;
    readonly title: string;
    readonly platform: Platform;
    readonly genre: string;
    readonly status: "outlining";
    readonly targetChapters: number;
    readonly chapterWordCount: number;
    readonly language?: "zh" | "en";
    readonly createdAt: string;
    readonly updatedAt: string;
}
interface StudioBookDetail {
    readonly book: {
        readonly id: string;
    };
    readonly chapters: ReadonlyArray<unknown>;
    readonly nextChapter: number;
}
interface WaitForStudioBookReadyOptions {
    readonly fetchImpl?: typeof fetch;
    readonly wait?: (delayMs: number) => Promise<void>;
    readonly maxAttempts?: number;
    readonly retryDelayMs?: number;
}
export declare function normalizeStudioPlatform(platform?: string): Platform;
export declare function buildStudioBookConfig(body: StudioCreateBookBody, now: string): StudioBookConfigDraft;
export declare function waitForStudioBookReady(bookId: string, options?: WaitForStudioBookReadyOptions): Promise<StudioBookDetail>;
export {};
//# sourceMappingURL=book-create.d.ts.map