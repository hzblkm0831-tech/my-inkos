// === Types ===
// === Level Ordering ===
const LEVEL_ORDER = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
// === ANSI Colors ===
const COLORS = {
    debug: "\x1b[90m", // gray
    info: "\x1b[36m", // cyan
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";
// === Built-in Sinks ===
export function createStderrSink(options) {
    const minLevel = options.minLevel ?? "info";
    const enableColors = options.enableColors ?? (process.stderr.isTTY ?? false);
    const minOrder = LEVEL_ORDER[minLevel];
    return {
        write(entry) {
            if (LEVEL_ORDER[entry.level] < minOrder)
                return;
            const levelTag = entry.level.toUpperCase().padEnd(5);
            const prefix = `[${entry.tag}]`;
            if (enableColors) {
                const color = COLORS[entry.level];
                process.stderr.write(`${color}${levelTag}${RESET} ${prefix} ${entry.message}\n`);
            }
            else {
                process.stderr.write(`${levelTag} ${prefix} ${entry.message}\n`);
            }
        },
    };
}
export function createJsonLineSink(writable) {
    return {
        write(entry) {
            writable.write(JSON.stringify(entry) + "\n");
        },
    };
}
export const nullSink = {
    write() { },
};
// === Factory ===
export function createLogger(options) {
    const { tag, sinks, baseCtx } = options;
    function emit(level, msg, ctx) {
        const entry = {
            level,
            tag,
            message: msg,
            timestamp: new Date().toISOString(),
            ...(ctx || baseCtx
                ? { ctx: { ...baseCtx, ...ctx } }
                : {}),
        };
        for (const sink of sinks) {
            sink.write(entry);
        }
    }
    return {
        debug: (msg, ctx) => emit("debug", msg, ctx),
        info: (msg, ctx) => emit("info", msg, ctx),
        warn: (msg, ctx) => emit("warn", msg, ctx),
        error: (msg, ctx) => emit("error", msg, ctx),
        child(childTag, extraCtx) {
            return createLogger({
                tag: childTag,
                sinks,
                baseCtx: { ...baseCtx, ...extraCtx },
            });
        },
    };
}
//# sourceMappingURL=logger.js.map