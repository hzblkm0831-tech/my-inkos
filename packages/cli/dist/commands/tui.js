import { Command } from "commander";
import { launchTui } from "../tui/app.js";
export function createTuiCommand(hooks = {}) {
    return new Command("tui")
        .description("Open the InkOS project workspace TUI")
        .action(async () => {
        if (hooks.launchTui) {
            await hooks.launchTui(process.cwd());
            return;
        }
        await launchTui(process.cwd());
    });
}
//# sourceMappingURL=tui.js.map