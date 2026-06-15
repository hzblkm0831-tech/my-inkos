import type { AutomationMode, ExecutionStatus, InteractionIntentType } from "@actalk/inkos-core";
import { type TuiLocale } from "./i18n.js";
export declare function formatTuiResult(params: {
    readonly intent: InteractionIntentType;
    readonly status: ExecutionStatus;
    readonly bookId?: string;
    readonly mode?: AutomationMode;
    readonly responseText?: string;
    readonly locale?: TuiLocale;
}): string;
//# sourceMappingURL=output.d.ts.map