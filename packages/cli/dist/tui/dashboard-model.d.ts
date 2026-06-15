import type { ExecutionStatus, InteractionMessage, InteractionSession } from "@actalk/inkos-core";
import { type TuiCopy } from "./i18n.js";
export interface DashboardMessageRow {
    readonly key: string;
    readonly label: string;
    readonly role: InteractionMessage["role"];
    readonly content: string;
}
export interface DashboardEventRow {
    readonly key: string;
    readonly status: ExecutionStatus;
    readonly summary: string;
}
export interface DashboardViewModel {
    readonly projectName: string;
    readonly activeBookTitle?: string;
    readonly modelLabel: string;
    readonly modeLabel: string;
    readonly executionStatus: ExecutionStatus;
    readonly executionLabel: string;
    readonly headerLine: string;
    readonly statusPrimaryLine: string;
    readonly statusSecondaryLine: string;
    readonly messageRows: ReadonlyArray<DashboardMessageRow>;
    readonly eventRows: ReadonlyArray<DashboardEventRow>;
    readonly pendingDecisionSummary?: string;
    readonly composerPlaceholder: string;
    readonly composerHelper: string;
    readonly composerStatus: string;
    readonly errorText?: string;
}
export interface BuildDashboardViewModelParams {
    readonly projectName: string;
    readonly activeBookTitle?: string;
    readonly modelLabel: string;
    readonly depthLabel?: string;
    readonly copy: TuiCopy;
    readonly session: InteractionSession;
    readonly isSubmitting: boolean;
    readonly lastError?: string;
    readonly sinceTimestamp?: number;
    readonly terminalRows?: number;
    readonly scrollOffset?: number;
}
export declare function buildDashboardViewModel(params: BuildDashboardViewModelParams): DashboardViewModel;
//# sourceMappingURL=dashboard-model.d.ts.map