export declare const SQLITE_MEMORY_MIN_NODE_MAJOR = 22;
export declare const SQLITE_MEMORY_PIN_VERSION: string;
export declare const SQLITE_MEMORY_PIN_FILES: readonly [".nvmrc", ".node-version"];
export interface SqliteMemorySupportResult {
    readonly ok: boolean;
    readonly detail: string;
}
export interface NodeRuntimePinStatus {
    readonly ok: boolean;
    readonly detail: string;
    readonly missing: ReadonlyArray<string>;
}
export interface NodeRuntimePinRepairResult {
    readonly updated: boolean;
    readonly written: ReadonlyArray<string>;
}
export declare function formatSqliteMemorySupportWarning(options?: {
    readonly nodeVersion?: string;
    readonly hasNodeSqlite?: boolean;
}): string | null;
export declare function inspectNodeRuntimePinFiles(root: string): Promise<NodeRuntimePinStatus>;
export declare function ensureNodeRuntimePinFiles(root: string): Promise<NodeRuntimePinRepairResult>;
export declare function parseNodeMajor(version: string): number;
export declare function evaluateSqliteMemorySupport(options?: {
    readonly nodeVersion?: string;
    readonly hasNodeSqlite?: boolean;
}): SqliteMemorySupportResult;
//# sourceMappingURL=runtime-requirements.d.ts.map