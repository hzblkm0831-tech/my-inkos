export declare const SLASH_COMMANDS: readonly ["/new <idea>", "/draft", "/create", "/discard", "/write", "/books", "/open <book>", "/mode <auto|semi|manual>", "/rewrite <n>", "/focus <text>", "/truth <file> <content>", "/rename <from> => <to>", "/replace <n> <from> => <to>", "/export [txt|md|epub]", "/help", "/status", "/clear", "/depth <light|normal|deep>", "/quit", "/exit"];
export type SlashNavigationDirection = "up" | "down";
export declare function getSlashSuggestions(input: string, commands: readonly string[]): string[];
export declare function getNextSlashSelection(currentIndex: number, suggestionCount: number, direction: SlashNavigationDirection): number;
export declare function applySlashSuggestion(_input: string, suggestions: readonly string[], selectedIndex: number): string;
//# sourceMappingURL=slash-autocomplete.d.ts.map