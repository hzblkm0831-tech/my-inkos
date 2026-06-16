import "dotenv/config";
import { PipelineRunner } from "./src/pipeline/runner.js";
import { createLLMClient } from "./src/llm/provider.js";
import { StateManager } from "./src/state/manager.js";

async function run() {
  const root = "./";
  const state = new StateManager(root);

  // Clean up any old test book
  const testBookId = "test-book-456";
  try {
    const bookDir = state.bookDir(testBookId);
    const { rm } = await import("node:fs/promises");
    await rm(bookDir, { recursive: true, force: true }).catch(() => {});
    console.log("Cleaned up old test book dir.");
  } catch {}

  const runner = new PipelineRunner({
    model: "gemini-2.5-flash",
    projectRoot: root,
    client: createLLMClient({
      provider: "google",
      baseUrl: "http://localhost:3000/v1",
      apiKey: "fake-key",
      model: "gemini-2.5-flash",
      temperature: 0.2,
      maxTokens: 8192,
      apiFormat: "chat",
      stream: true,
    }),
    modelOverrides: {
      "foundation-reviewer": "gemini-3.1-flash-lite",
    },
    logger: {
      info: (...args: any[]) => console.log("[INFO]", ...args),
      warn: (...args: any[]) => console.warn("[WARN]", ...args),
      error: (...args: any[]) => console.error("[ERROR]", ...args),
      debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
      child: () => ({
        info: (...args: any[]) => console.log("[INFO]", ...args),
        warn: (...args: any[]) => console.warn("[WARN]", ...args),
        error: (...args: any[]) => console.error("[ERROR]", ...args),
        debug: (...args: any[]) => console.debug("[DEBUG]", ...args),
      }),
    } as any,
  });

  try {
    console.log("Starting initBook test...");
    await runner.initBook({
      id: testBookId,
      title: "废土贸易商：从零开始的跨界帝国",
      genre: "xuanhuan",
      platform: "qidian",
      targetChapters: 100,
      chapterWordCount: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    });
    console.log("Success! Book created successfully!");
  } catch (err) {
    console.error("FAILED initBook:", err);
  }
}

run();
