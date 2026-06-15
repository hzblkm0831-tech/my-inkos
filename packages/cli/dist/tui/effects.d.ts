import { type TuiLocale } from "./i18n.js";
export interface OperationTheme {
    readonly icon: string;
    readonly color: string;
    readonly brightColor: string;
    readonly bg: string;
    readonly label: string;
    readonly frames: ReadonlyArray<string>;
}
export interface StyledHelpSection {
    readonly title: string;
    readonly commands: ReadonlyArray<readonly [string, string]>;
}
export declare const THEMES: Record<string, OperationTheme>;
export declare class ThemedSpinner {
    private interval;
    private frame;
    private elapsed;
    private theme;
    constructor(themeName?: string);
    start(label?: string): void;
    update(label: string): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    stop(): void;
    private clear;
}
export declare function inputPromptPrefix(): string;
export declare function drawInputHint(): void;
export declare function printInputSeparator(): void;
export interface StartupModelInfo {
    readonly provider: string;
    readonly model: string;
}
export declare function animateStartup(version: string, projectName: string, bookTitle?: string, modelInfo?: StartupModelInfo): Promise<void>;
export declare function formatResultCard(content: string, intent?: string): string;
export declare function intentToBadge(intent: string, locale?: TuiLocale): string;
export declare function intentToTheme(intent: string): string;
export declare function printStyledHelp(): void;
export declare function printStyledStatus(params: {
    readonly mode: string;
    readonly bookId?: string;
    readonly status: string;
    readonly events: ReadonlyArray<{
        readonly kind: string;
        readonly detail?: string;
        readonly status: string;
    }>;
}): void;
export declare function formatStyledStatusLines(locale: TuiLocale, params: {
    readonly mode: string;
    readonly bookId?: string;
    readonly status: string;
    readonly events: ReadonlyArray<{
        readonly kind: string;
        readonly detail?: string;
        readonly status: string;
    }>;
}): string[];
export declare function buildStyledHelpSections(locale?: TuiLocale): StyledHelpSection[];
//# sourceMappingURL=effects.d.ts.map