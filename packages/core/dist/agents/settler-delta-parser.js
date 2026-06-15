import { RuntimeStateDeltaSchema, } from "../models/runtime-state.js";
function sanitizeJSON(str) {
    return str
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/,\s*([}\]])/g, "$1");
}
export function parseSettlerDeltaOutput(content) {
    const extract = (tag) => {
        const regex = new RegExp(`=== ${tag} ===\\s*([\\s\\S]*?)(?==== [A-Z_]+ ===|$)`);
        const match = content.match(regex);
        return match?.[1]?.trim() ?? "";
    };
    const rawDelta = extract("RUNTIME_STATE_DELTA");
    if (!rawDelta) {
        throw new Error("runtime state delta block is missing");
    }
    const jsonPayload = stripCodeFence(rawDelta);
    let parsed;
    try {
        parsed = JSON.parse(sanitizeJSON(jsonPayload));
    }
    catch (error) {
        throw new Error(`runtime state delta is not valid JSON: ${String(error)}`);
    }
    try {
        return {
            postSettlement: extract("POST_SETTLEMENT"),
            runtimeStateDelta: RuntimeStateDeltaSchema.parse(parsed),
        };
    }
    catch (error) {
        throw new Error(`runtime state delta failed schema validation: ${String(error)}`);
    }
}
function stripCodeFence(value) {
    const trimmed = value.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced?.[1]?.trim() ?? trimmed;
}
//# sourceMappingURL=settler-delta-parser.js.map