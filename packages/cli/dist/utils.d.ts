import { GLOBAL_CONFIG_DIR, GLOBAL_ENV_PATH, type ProjectConfig, type PipelineConfig } from "@actalk/inkos-core";
export { GLOBAL_CONFIG_DIR, GLOBAL_ENV_PATH };
export declare function resolveContext(opts: {
    readonly context?: string;
    readonly contextFile?: string;
}): Promise<string | undefined>;
export declare function findProjectRoot(): string;
export declare function loadConfig(options?: {
    readonly requireApiKey?: boolean;
    readonly projectRoot?: string;
}): Promise<ProjectConfig>;
export declare function createClient(config: ProjectConfig): import("@actalk/inkos-core").LLMClient;
export declare function buildPipelineConfig(config: ProjectConfig, root: string, extra?: Partial<Pick<PipelineConfig, "notifyChannels" | "radarSources" | "externalContext" | "inputGovernanceMode">> & {
    readonly quiet?: boolean;
    readonly logFile?: NodeJS.WritableStream;
}): PipelineConfig;
export declare function log(message: string): void;
export declare function logError(message: string): void;
/**
 * Resolve book-id: if provided use it, otherwise auto-detect when exactly one book exists.
 * Validates that the book actually exists.
 */
export declare function resolveBookId(bookIdArg: string | undefined, root: string): Promise<string>;
export declare function getLegacyMigrationHint(root: string, bookId: string): Promise<string | null>;
//# sourceMappingURL=utils.d.ts.map