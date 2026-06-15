import type { ChatDepth } from "./chat-depth.js";
export type TuiLocale = "zh-CN" | "en";
export interface TuiCopy {
    readonly locale: TuiLocale;
    readonly labels: {
        readonly project: string;
        readonly book: string;
        readonly depth: string;
        readonly session: string;
        readonly messageCount: (count: number) => string;
        readonly stage: string;
        readonly mode: string;
        readonly model: string;
        readonly error: string;
        readonly recent: string;
        readonly pending: string;
        readonly draft: string;
        readonly ready: string;
        readonly none: string;
        readonly notConfigured: string;
        readonly unknown: string;
    };
    readonly modeLabels: Record<string, string>;
    readonly composer: {
        readonly placeholder: string;
        readonly emptyConversation: string;
        readonly helper: string;
        readonly submitting: string;
        readonly failed: string;
        readonly ready: string;
    };
    readonly notes: {
        readonly help: string;
        readonly status: (stage: string, mode: string) => string;
        readonly config: string;
        readonly depthSet: (depthLabel: string) => string;
        readonly noLlmConfig: string;
        readonly setupProvider: string;
        readonly toolInitFailed: (message: string) => string;
        readonly toolInitHint: string;
    };
    readonly roles: {
        readonly user: string;
        readonly assistant: string;
        readonly system: string;
    };
    readonly activity: Record<"thinking" | "checking" | "writing" | "reviewing" | "updating", string>;
    readonly stageLabels: {
        readonly completed: string;
        readonly failed: string;
        readonly blocked: string;
        readonly waitingHuman: string;
        readonly pausedByUser: string;
        readonly readyToContinue: string;
    };
    readonly depthLabels: Record<ChatDepth, string>;
    readonly results: {
        readonly modeSwitched: (mode: string) => string;
        readonly booksListed: string;
        readonly activeBook: (bookId: string) => string;
        readonly completed: (intent: string) => string;
        readonly intentLabels: Partial<Record<string, string>>;
    };
}
export declare function resolveTuiLocale(env?: NodeJS.ProcessEnv, preferredLanguage?: string): TuiLocale;
export declare function getTuiCopy(locale: TuiLocale): TuiCopy;
export declare function normalizeStageLabel(label: string, copy: TuiCopy): string;
export declare function formatModeLabel(mode: string, copy: TuiCopy): string;
//# sourceMappingURL=i18n.d.ts.map