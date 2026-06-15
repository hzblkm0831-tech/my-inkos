import type { BookConfig } from "../models/book.js";
import type { GenreProfile } from "../models/genre-profile.js";
/**
 * Observer phase: extract ALL facts from the chapter.
 * Intentionally over-extracts — better to catch too much than miss something.
 * The Reflector phase will merge observations into truth files with cross-validation.
 */
export declare function buildObserverSystemPrompt(book: BookConfig, genreProfile: GenreProfile, language?: "zh" | "en"): string;
export declare function buildObserverUserPrompt(chapterNumber: number, title: string, content: string, language?: "zh" | "en"): string;
//# sourceMappingURL=observer-prompts.d.ts.map