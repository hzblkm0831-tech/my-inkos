export const SLASH_COMMANDS = [
    "/new <idea>",
    "/draft",
    "/create",
    "/discard",
    "/write",
    "/books",
    "/open <book>",
    "/mode <auto|semi|manual>",
    "/rewrite <n>",
    "/focus <text>",
    "/truth <file> <content>",
    "/rename <from> => <to>",
    "/replace <n> <from> => <to>",
    "/export [txt|md|epub]",
    "/help",
    "/status",
    "/clear",
    "/depth <light|normal|deep>",
    "/quit",
    "/exit",
];
export function getSlashSuggestions(input, commands) {
    const value = input.trim();
    if (!value.startsWith("/")) {
        return [];
    }
    return commands.filter((command) => slashCommandStem(command).startsWith(value));
}
export function getNextSlashSelection(currentIndex, suggestionCount, direction) {
    if (suggestionCount <= 0) {
        return 0;
    }
    if (direction === "down") {
        return (currentIndex + 1) % suggestionCount;
    }
    return (currentIndex - 1 + suggestionCount) % suggestionCount;
}
export function applySlashSuggestion(_input, suggestions, selectedIndex) {
    const suggestion = suggestions[selectedIndex] ?? "";
    return slashSuggestionInsertion(suggestion);
}
function slashCommandStem(command) {
    return command.match(/^\/\S+/)?.[0] ?? command;
}
function slashSuggestionInsertion(suggestion) {
    const stem = slashCommandStem(suggestion);
    return suggestion === stem ? stem : `${stem} `;
}
//# sourceMappingURL=slash-autocomplete.js.map