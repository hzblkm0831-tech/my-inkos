export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
    readonly level: LogLevel;
    readonly tag: string;
    readonly message: string;
    readonly timestamp: string;
    readonly ctx?: Record<string, unknown>;
}
export interface LogSink {
    readonly write: (entry: LogEntry) => void;
}
export interface Logger {
    readonly debug: (msg: string, ctx?: Record<string, unknown>) => void;
    readonly info: (msg: string, ctx?: Record<string, unknown>) => void;
    readonly warn: (msg: string, ctx?: Record<string, unknown>) => void;
    readonly error: (msg: string, ctx?: Record<string, unknown>) => void;
    readonly child: (tag: string, extraCtx?: Record<string, unknown>) => Logger;
}
export declare function createStderrSink(options: {
    readonly minLevel?: LogLevel;
    readonly enableColors?: boolean;
}): LogSink;
export declare function createJsonLineSink(writable: NodeJS.WritableStream): LogSink;
export declare const nullSink: LogSink;
export declare function createLogger(options: {
    readonly tag: string;
    readonly sinks: ReadonlyArray<LogSink>;
    readonly minLevel?: LogLevel;
    readonly baseCtx?: Record<string, unknown>;
}): Logger;
//# sourceMappingURL=logger.d.ts.map