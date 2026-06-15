import { Hono } from "hono";
import { type ProjectConfig } from "@actalk/inkos-core";
export declare function createStudioServer(initialConfig: ProjectConfig, root: string): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export declare function startStudioServer(root: string, port?: number, options?: {
    readonly staticDir?: string;
}): Promise<void>;
//# sourceMappingURL=server.d.ts.map