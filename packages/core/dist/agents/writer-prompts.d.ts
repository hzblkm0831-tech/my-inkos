import type { BookConfig, FanficMode } from "../models/book.js";
import type { GenreProfile } from "../models/genre-profile.js";
import type { BookRules } from "../models/book-rules.js";
import type { LengthSpec } from "../models/length-governance.js";
export interface FanficContext {
    readonly fanficCanon: string;
    readonly fanficMode: FanficMode;
    readonly allowedDeviations: ReadonlyArray<string>;
}
export declare function buildWriterSystemPrompt(book: BookConfig, genreProfile: GenreProfile, bookRules: BookRules | null, bookRulesBody: string, genreBody: string, styleGuide: string, styleFingerprint?: string, chapterNumber?: number, mode?: "full" | "creative", fanficContext?: FanficContext, languageOverride?: "zh" | "en", inputProfile?: "legacy" | "governed", lengthSpec?: LengthSpec): string;
//# sourceMappingURL=writer-prompts.d.ts.map