import { Command } from "commander";
export interface TuiCommandHooks {
    readonly launchTui?: (projectRoot: string) => Promise<void> | void;
}
export declare function createTuiCommand(hooks?: TuiCommandHooks): Command;
//# sourceMappingURL=tui.d.ts.map