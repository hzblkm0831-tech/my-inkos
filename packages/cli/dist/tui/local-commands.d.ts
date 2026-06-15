import type { ChatDepth } from "./chat-depth.js";
export type LocalTuiCommand = "help" | "status" | "quit" | "clear" | "config";
export declare function classifyLocalTuiCommand(input: string): LocalTuiCommand | undefined;
export declare function parseDepthCommand(input: string): ChatDepth | undefined;
//# sourceMappingURL=local-commands.d.ts.map