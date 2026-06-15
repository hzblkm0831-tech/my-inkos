import type { InteractionMessage } from "@actalk/inkos-core";
export interface InputHistoryState {
    readonly cursor: number | null;
    readonly draft: string;
}
export type InputHistoryDirection = "up" | "down";
export declare function buildInputHistory(messages: ReadonlyArray<InteractionMessage>): string[];
export declare function moveHistoryCursor(entries: ReadonlyArray<string>, state: InputHistoryState, currentValue: string, direction: InputHistoryDirection): {
    state: InputHistoryState;
    value: string;
};
//# sourceMappingURL=input-history.d.ts.map