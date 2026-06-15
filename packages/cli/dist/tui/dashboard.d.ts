import React from "react";
import { type InteractionRuntimeTools, type InteractionSession } from "@actalk/inkos-core";
import { type TuiLocale } from "./i18n.js";
export interface InkTuiDashboardProps {
    readonly locale: TuiLocale;
    readonly projectName: string;
    readonly activeBookTitle?: string;
    readonly modelLabel: string;
    readonly depthLabel?: string;
    readonly session: InteractionSession;
    readonly inputValue: string;
    readonly isSubmitting: boolean;
    readonly sinceTimestamp?: number;
    readonly lastError?: string;
    readonly slashSuggestions?: ReadonlyArray<string>;
    readonly selectedSlashIndex?: number;
    readonly showComposerCursor?: boolean;
    readonly scrollOffset?: number;
    readonly onInputChange?: (value: string) => void;
    readonly onSubmit?: (value: string) => void;
}
export interface InkTuiAppProps {
    readonly locale: TuiLocale;
    readonly projectRoot: string;
    readonly projectName: string;
    readonly modelLabel: string;
    readonly initialSession: InteractionSession;
    readonly tools: InteractionRuntimeTools;
    readonly chatStreamBridge?: {
        onTextDelta?: (text: string) => void;
        getChatRequestOptions?: () => {
            readonly temperature?: number;
            readonly maxTokens?: number;
        };
    };
}
export declare function InkTuiDashboard(props: InkTuiDashboardProps): React.JSX.Element;
export declare function InkTuiApp(props: InkTuiAppProps): React.JSX.Element;
//# sourceMappingURL=dashboard.d.ts.map