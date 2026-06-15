import { BaseAgent } from "./base.js";
import type { FanficMode } from "../models/book.js";
export interface FanficCanonOutput {
    readonly worldRules: string;
    readonly characterProfiles: string;
    readonly keyEvents: string;
    readonly powerSystem: string;
    readonly writingStyle: string;
    readonly fullDocument: string;
}
export declare class FanficCanonImporter extends BaseAgent {
    get name(): string;
    importFromText(sourceText: string, sourceName: string, fanficMode: FanficMode): Promise<FanficCanonOutput>;
}
//# sourceMappingURL=fanfic-canon-importer.d.ts.map