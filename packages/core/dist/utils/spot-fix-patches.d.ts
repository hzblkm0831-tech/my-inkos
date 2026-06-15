export interface SpotFixPatch {
    readonly targetText: string;
    readonly replacementText: string;
}
export interface SpotFixPatchApplyResult {
    readonly applied: boolean;
    readonly revisedContent: string;
    readonly rejectedReason?: string;
    readonly appliedPatchCount: number;
    readonly touchedChars: number;
}
export declare function parseSpotFixPatches(raw: string): SpotFixPatch[];
export declare function applySpotFixPatches(original: string, patches: ReadonlyArray<SpotFixPatch>): SpotFixPatchApplyResult;
//# sourceMappingURL=spot-fix-patches.d.ts.map