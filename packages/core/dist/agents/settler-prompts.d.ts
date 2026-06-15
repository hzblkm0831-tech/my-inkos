import type { BookConfig } from "../models/book.js";
import type { GenreProfile } from "../models/genre-profile.js";
import type { BookRules } from "../models/book-rules.js";
export declare function buildSettlerSystemPrompt(book: BookConfig, genreProfile: GenreProfile, bookRules: BookRules | null, language?: "zh" | "en"): string;
export declare function buildSettlerUserPrompt(params: {
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly currentState: string;
    readonly ledger: string;
    readonly hooks: string;
    readonly chapterSummaries: string;
    readonly subplotBoard: string;
    readonly emotionalArcs: string;
    readonly characterMatrix: string;
    readonly volumeOutline: string;
    readonly observations?: string;
    readonly selectedEvidenceBlock?: string;
    readonly governedControlBlock?: string;
    readonly validationFeedback?: string;
}): string;
//# sourceMappingURL=settler-prompts.d.ts.map