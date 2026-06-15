/**
 * Structured API error handling.
 * Ported from PR #96 (Te9ui1a) — typed error codes for consistent JSON responses.
 */
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
//# sourceMappingURL=errors.d.ts.map