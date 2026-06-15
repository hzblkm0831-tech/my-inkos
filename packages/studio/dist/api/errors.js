/**
 * Structured API error handling.
 * Ported from PR #96 (Te9ui1a) — typed error codes for consistent JSON responses.
 */
export class ApiError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}
//# sourceMappingURL=errors.js.map