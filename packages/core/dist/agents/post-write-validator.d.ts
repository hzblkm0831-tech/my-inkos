/**
 * Post-write rule-based validator.
 *
 * Deterministic, zero-LLM-cost checks that run after every chapter generation.
 * Catches violations that prompt-only rules cannot guarantee.
 */
import type { BookRules } from "../models/book-rules.js";
import type { GenreProfile } from "../models/genre-profile.js";
export interface PostWriteViolation {
    readonly rule: string;
    readonly severity: "error" | "warning";
    readonly description: string;
    readonly suggestion: string;
}
export declare function validatePostWrite(content: string, genreProfile: GenreProfile, bookRules: BookRules | null, languageOverride?: "zh" | "en"): ReadonlyArray<PostWriteViolation>;
/**
 * Cross-chapter repetition check.
 * Detects phrases from the current chapter that also appeared in recent chapters.
 */
export declare function detectCrossChapterRepetition(currentContent: string, recentChaptersContent: string, language?: "zh" | "en"): ReadonlyArray<PostWriteViolation>;
export declare function detectParagraphLengthDrift(currentContent: string, recentChaptersContent: string, language?: "zh" | "en"): ReadonlyArray<PostWriteViolation>;
export declare function detectParagraphShapeWarnings(content: string, language?: "zh" | "en"): ReadonlyArray<PostWriteViolation>;
/**
 * Detect duplicate or near-duplicate chapter titles.
 * Compares the new title against existing chapter titles from index.
 */
export declare function detectDuplicateTitle(newTitle: string, existingTitles: ReadonlyArray<string>): ReadonlyArray<PostWriteViolation>;
export declare function resolveDuplicateTitle(newTitle: string, existingTitles: ReadonlyArray<string>, language?: "zh" | "en", options?: {
    readonly content?: string;
}): {
    readonly title: string;
    readonly issues: ReadonlyArray<PostWriteViolation>;
};
//# sourceMappingURL=post-write-validator.d.ts.map