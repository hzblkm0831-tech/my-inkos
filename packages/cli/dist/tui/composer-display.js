export function renderComposerDisplay(inputValue, placeholder, showCursor) {
    if (!inputValue) {
        return {
            textBeforeCursor: showCursor ? "" : placeholder,
            textAfterCursor: showCursor ? placeholder : "",
            cursor: showCursor ? "│" : "",
            isPlaceholder: true,
        };
    }
    return {
        textBeforeCursor: inputValue,
        textAfterCursor: "",
        cursor: showCursor ? "│" : "",
        isPlaceholder: false,
    };
}
//# sourceMappingURL=composer-display.js.map