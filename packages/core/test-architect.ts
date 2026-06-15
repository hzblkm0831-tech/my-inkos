import "dotenv/config";
import { createLLMClient } from "./src/llm/provider.js";
import { ArchitectAgent } from "./src/agents/architect.js";

class VerboseArchitectAgent extends ArchitectAgent {
  async chat(messages: any, options: any) {
    const res = await super.chat(messages, options);
    console.log("=== RAW LLM RESPONSE START ===");
    console.log(res.content);
    console.log("=== RAW LLM RESPONSE END ===");
    console.log("Usage stats:", res.usage);
    return res;
  }
}

async function run() {
  const client = createLLMClient({
    provider: "google",
    baseUrl: "http://localhost:3000/v1",
    apiKey: "fake-key",
    model: "gemini-2.5-flash",
    temperature: 0.2,
    maxTokens: 8192,
    apiFormat: "chat",
    stream: true,
  });

  const architect = new VerboseArchitectAgent({
    client,
    model: "gemini-2.5-flash",
    projectRoot: "./",
  });

  try {
    const result = await architect.generateFoundation({
      id: "test",
      title: "废土贸易商：从零开始的跨界帝国",
      genre: "xuanhuan",
      platform: "qidian",
      targetChapters: 100,
      chapterWordCount: 2000,
    });
    console.log("Success! Extracted book_rules:", result.bookRules.substring(0, 100));
  } catch (err) {
    console.error("FAILED:", err);
  }
}

run();
