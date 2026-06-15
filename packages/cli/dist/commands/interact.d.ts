import { Command } from "commander";
import { type InteractionRuntimeTools } from "@actalk/inkos-core";
export interface InteractCommandHooks {
    readonly runInteraction?: (params: {
        readonly projectRoot: string;
        readonly input: string;
        readonly activeBookId?: string;
        readonly tools: InteractionRuntimeTools;
    }) => Promise<{
        readonly request: unknown;
        readonly responseText?: string;
        readonly session: {
            readonly automationMode: string;
            readonly activeBookId?: string;
            readonly currentExecution?: unknown;
            readonly pendingDecision?: unknown;
            readonly messages: ReadonlyArray<unknown>;
            readonly events: ReadonlyArray<unknown>;
        };
    }>;
    readonly createTools?: (projectRoot: string) => Promise<InteractionRuntimeTools>;
    readonly readInput?: () => Promise<string>;
}
export declare function createInteractCommand(hooks?: InteractCommandHooks): Command;
//# sourceMappingURL=interact.d.ts.map