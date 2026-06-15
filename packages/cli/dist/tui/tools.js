import { PipelineRunner, StateManager, createInteractionToolsFromDeps, } from "@actalk/inkos-core";
import { buildPipelineConfig, loadConfig } from "../utils.js";
export function createCliInteractionToolsFromDeps(pipeline, state, hooks) {
    return createInteractionToolsFromDeps(pipeline, state, hooks);
}
// Backward-compatible export for the current CLI tests during the extraction phase.
export function createInteractionToolsFromDepsCompat(_projectRoot, pipeline, state, hooks) {
    return createInteractionToolsFromDeps(pipeline, state, hooks);
}
export { createInteractionToolsFromDepsCompat as createInteractionToolsFromDeps };
export async function createInteractionTools(projectRoot, hooks) {
    const config = await loadConfig({ projectRoot });
    const pipeline = new PipelineRunner(buildPipelineConfig(config, projectRoot));
    const state = new StateManager(projectRoot);
    return createInteractionToolsFromDeps(pipeline, state, hooks);
}
//# sourceMappingURL=tools.js.map