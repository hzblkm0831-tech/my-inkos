import { Command } from "commander";
export interface StudioLaunchSpec {
    readonly studioEntry: string;
    readonly command: string;
    readonly args: string[];
}
export interface BrowserLaunchSpec {
    readonly command: string;
    readonly args: string[];
}
export declare function resolveBrowserLaunch(platform: NodeJS.Platform, url: string): BrowserLaunchSpec;
export declare function resolveStudioLaunch(root: string): Promise<StudioLaunchSpec | null>;
export declare const studioCommand: Command;
//# sourceMappingURL=studio.d.ts.map