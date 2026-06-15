import { type ToolDefinition } from "../llm/provider.js";
import { PipelineRunner, type PipelineConfig } from "./runner.js";
/** Tool definitions for the agent loop. */
declare const TOOLS: ReadonlyArray<ToolDefinition>;
export interface AgentLoopOptions {
    readonly onToolCall?: (name: string, args: Record<string, unknown>) => void;
    readonly onToolResult?: (name: string, result: string) => void;
    readonly onMessage?: (content: string) => void;
    readonly maxTurns?: number;
}
export declare function runAgentLoop(config: PipelineConfig, instruction: string, options?: AgentLoopOptions): Promise<string>;
export declare function executeAgentTool(pipeline: PipelineRunner, state: import("../state/manager.js").StateManager, config: PipelineConfig, name: string, args: Record<string, unknown>): Promise<string>;
/** Export tool definitions so external systems can reference them. */
export { TOOLS as AGENT_TOOLS };
//# sourceMappingURL=agent.d.ts.map