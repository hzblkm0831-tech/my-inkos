import { type InteractionSession } from "./session.js";
export declare function resolveProjectSessionPath(projectRoot: string): string;
export declare function createProjectSession(projectRoot: string): InteractionSession;
export declare function loadProjectSession(projectRoot: string): Promise<InteractionSession>;
export declare function persistProjectSession(projectRoot: string, session: InteractionSession): Promise<void>;
export declare function resolveSessionActiveBook(projectRoot: string, session: InteractionSession): Promise<string | undefined>;
//# sourceMappingURL=project-session-store.d.ts.map