/**
 * POV-aware context filtering.
 *
 * Filters truth file content based on the current POV character's
 * information boundaries. Characters should only "see" information
 * they've actually witnessed or been told about.
 *
 * Works with markdown-based truth files (no DB dependency).
 * When MemoryDB is available, can do more precise queries.
 */
/**
 * Extract the POV character from the volume outline for a given chapter.
 * Looks for patterns like "POV: 角色名" or "视角: 角色名" or "POV: CharacterName"
 * in the chapter's section of the outline.
 */
export declare function extractPOVFromOutline(volumeOutline: string, chapterNumber: number): string | null;
/**
 * Filter character_matrix information boundaries for the POV character.
 * Returns only what the POV character knows — strips other characters' "known info".
 */
export declare function filterMatrixByPOV(characterMatrix: string, povCharacter: string): string;
/**
 * Filter pending_hooks by POV character's knowledge.
 * Hooks planted in scenes where the POV character was NOT present are hidden.
 *
 * This is a heuristic: if the hook's chapter summary mentions the POV character,
 * they likely know about it.
 */
export declare function filterHooksByPOV(hooks: string, povCharacter: string, chapterSummaries: string): string;
//# sourceMappingURL=pov-filter.d.ts.map