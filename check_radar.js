import { loadProjectConfig } from "./packages/core/dist/utils/config-loader.js";
import { createLLMClient } from "./packages/core/dist/llm/provider.js";
import { PipelineRunner } from "./packages/core/dist/pipeline/runner.js";

async function test() {
  try {
    console.log("Loading config...");
    const config = await loadProjectConfig(process.cwd());
    console.log("Creating LLM client...");
    const client = createLLMClient(config.llm);
    console.log("Initializing runner...");
    const runner = new PipelineRunner({
      ...config,
      client,
      model: config.llm.model,
      projectRoot: process.cwd(),
      defaultLLMConfig: config.llm,
    });
    console.log("Running radar...");
    const result = await runner.runRadar();
    console.log("Radar Success!", result);
  } catch (e) {
    console.error("Radar Failed with error:", e);
  }
}

test();
