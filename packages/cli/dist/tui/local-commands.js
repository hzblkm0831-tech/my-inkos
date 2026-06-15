export function classifyLocalTuiCommand(input) {
    const value = input.trim();
    if (/^\/help$/i.test(value) || /^(help|帮助)$/i.test(value)) {
        return "help";
    }
    if (/^\/status$/i.test(value) || /^(status|状态)$/i.test(value)) {
        return "status";
    }
    if (/^\/clear$/i.test(value) || /^清屏$/i.test(value)) {
        return "clear";
    }
    if (/^\/config$/i.test(value) || /^(config|配置)$/i.test(value)) {
        return "config";
    }
    if (/^\/quit$/i.test(value) || /^\/exit$/i.test(value) || /^(quit|exit|bye|退出)$/i.test(value)) {
        return "quit";
    }
    return undefined;
}
export function parseDepthCommand(input) {
    const value = input.trim().toLowerCase();
    const englishMatch = value.match(/^\/?depth\s+(light|normal|deep)$/);
    if (englishMatch?.[1]) {
        return englishMatch[1];
    }
    const chineseMatch = input.trim().match(/^\/?深度\s+(浅|轻量|标准|普通|深|深入)$/);
    if (!chineseMatch?.[1]) {
        return undefined;
    }
    switch (chineseMatch[1]) {
        case "浅":
        case "轻量":
            return "light";
        case "深":
        case "深入":
            return "deep";
        case "标准":
        case "普通":
        default:
            return "normal";
    }
}
//# sourceMappingURL=local-commands.js.map