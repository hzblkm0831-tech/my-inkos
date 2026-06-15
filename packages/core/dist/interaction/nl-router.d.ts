import type { InteractionRequest } from "./intents.js";
export interface NaturalLanguageRoutingContext {
    readonly activeBookId?: string;
    readonly hasCreationDraft?: boolean;
    readonly hasFailed?: boolean;
}
export declare function routeNaturalLanguageIntent(input: string, context?: NaturalLanguageRoutingContext): InteractionRequest;
//# sourceMappingURL=nl-router.d.ts.map