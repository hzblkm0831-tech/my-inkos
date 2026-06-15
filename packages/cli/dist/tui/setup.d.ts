import { type TuiLocale } from "./i18n.js";
interface SetupResult {
    readonly projectRoot: string;
    readonly hasLlmConfig: boolean;
}
export interface InteractiveSetupCopy {
    readonly title: string;
    readonly subtitle: string;
    readonly steps: {
        readonly provider: string;
        readonly baseUrl: string;
        readonly apiKey: string;
        readonly model: string;
        readonly scope: string;
    };
    readonly hints: {
        readonly provider: string;
        readonly baseUrl: string;
        readonly model: string;
        readonly scope: string;
    };
    readonly defaults: {
        readonly provider: string;
        readonly baseUrl: string;
        readonly scope: string;
    };
    readonly scopeChoices: {
        readonly global: string;
        readonly project: string;
    };
    readonly savedTo: string;
}
export declare function buildInteractiveSetupCopy(locale: TuiLocale): InteractiveSetupCopy;
export declare function buildAutoInitMessages(projectName: string, locale: TuiLocale): {
    readonly initializing: string;
    readonly initialized: string;
    readonly envTemplateHeader: string;
};
export declare function ensureProject(cwd: string): Promise<SetupResult>;
export declare function interactiveLlmSetup(projectRoot: string): Promise<void>;
export interface ModelInfo {
    readonly provider: string;
    readonly model: string;
    readonly baseUrl: string;
}
export declare function detectModelInfo(projectRoot: string): Promise<ModelInfo | undefined>;
export declare function detectProjectLanguage(projectRoot: string): Promise<string | undefined>;
export {};
//# sourceMappingURL=setup.d.ts.map