import { type ProjectConfig } from "../models/project.js";
export declare const GLOBAL_CONFIG_DIR: string;
export declare const GLOBAL_ENV_PATH: string;
export declare function isApiKeyOptionalForEndpoint(params: {
    readonly provider?: string | undefined;
    readonly baseUrl?: string | undefined;
}): boolean;
/**
 * Load project config from inkos.json with .env overrides.
 * Shared by CLI and Studio — single source of truth for config loading.
 */
export declare function loadProjectConfig(root: string, options?: {
    readonly requireApiKey?: boolean;
}): Promise<ProjectConfig>;
//# sourceMappingURL=config-loader.d.ts.map