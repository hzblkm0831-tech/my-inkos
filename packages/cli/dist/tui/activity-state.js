import { WARM_ACCENT } from "./theme.js";
const DOTS = ["·  ", "·· ", "···", " ··", "  ·"];
const WAVE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴"];
const PULSE = ["◜", "◠", "◝", "◞", "◡", "◟"];
export function describeActivityState(intent, copy) {
    switch (intent) {
        case "write_next":
        case "continue_book":
            return { label: copy.activity.writing, frames: WAVE, accent: WARM_ACCENT, intervalMs: 180 };
        case "revise_chapter":
        case "rewrite_chapter":
            return { label: copy.activity.reviewing, frames: WAVE, accent: WARM_ACCENT, intervalMs: 180 };
        case "update_focus":
        case "update_author_intent":
        case "edit_truth":
            return { label: copy.activity.updating, frames: PULSE, accent: WARM_ACCENT, intervalMs: 220 };
        case "list_books":
        case "select_book":
        case "switch_mode":
        case "explain_status":
            return { label: copy.activity.checking, frames: DOTS, accent: WARM_ACCENT, intervalMs: 220 };
        case "chat":
        default:
            return { label: copy.activity.thinking, frames: DOTS, accent: WARM_ACCENT, intervalMs: 220 };
    }
}
//# sourceMappingURL=activity-state.js.map