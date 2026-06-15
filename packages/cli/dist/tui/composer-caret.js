export function resolveComposerCaretState(params) {
    if (params.isSubmitting) {
        return {
            visible: false,
            shouldAnimate: false,
        };
    }
    return {
        visible: true,
        shouldAnimate: false,
    };
}
//# sourceMappingURL=composer-caret.js.map