import { z } from "zod";
export declare const AutomationModeSchema: z.ZodEnum<["auto", "semi", "manual"]>;
export type AutomationMode = z.infer<typeof AutomationModeSchema>;
export declare function normalizeAutomationMode(mode: string | undefined, fallback?: AutomationMode): AutomationMode;
//# sourceMappingURL=modes.d.ts.map