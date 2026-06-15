import { formatModeLabel, getTuiCopy, resolveTuiLocale } from "./i18n.js";
export function formatTuiResult(params) {
    const copy = getTuiCopy(params.locale ?? resolveTuiLocale());
    if (params.responseText?.trim()) {
        return params.responseText.trim();
    }
    if (params.intent === "switch_mode" && params.mode) {
        return copy.results.modeSwitched(formatModeLabel(params.mode, copy));
    }
    if (params.intent === "list_books") {
        return copy.results.booksListed;
    }
    if (params.intent === "select_book" && params.bookId) {
        return copy.results.activeBook(params.bookId);
    }
    if (params.bookId) {
        return `${intentLabel(params.intent, copy)} — ${params.bookId}`;
    }
    return intentLabel(params.intent, copy);
}
function intentLabel(intent, copy) {
    return copy.results.intentLabels[intent] ?? copy.results.completed(intent);
}
//# sourceMappingURL=output.js.map