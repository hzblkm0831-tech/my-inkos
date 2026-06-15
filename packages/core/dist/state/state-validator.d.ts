export interface RuntimeStateValidationIssue {
    readonly code: string;
    readonly message: string;
    readonly path?: string;
}
export declare function validateRuntimeState(input: {
    readonly manifest: unknown;
    readonly currentState: unknown;
    readonly hooks: unknown;
    readonly chapterSummaries: unknown;
}): RuntimeStateValidationIssue[];
//# sourceMappingURL=state-validator.d.ts.map