export interface ComposerCaretState {
    readonly visible: boolean;
    readonly shouldAnimate: boolean;
}
export declare function resolveComposerCaretState(params: {
    readonly inputValue: string;
    readonly isSubmitting: boolean;
    readonly blinkTick: number;
}): ComposerCaretState;
//# sourceMappingURL=composer-caret.d.ts.map