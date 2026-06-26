import { describe, expect, it, vi, afterEach } from "vitest";
import { BaseAgent } from "../agents/base.js";
import * as provider from "../llm/provider.js";

class DummyAgent extends BaseAgent {
  get name() {
    return "dummy";
  }

  public async triggerChat(temperature?: number) {
    return this.chat(
      [{ role: "user", content: "hello" }],
      temperature !== undefined ? { temperature } : undefined
    );
  }
}

describe("Agent Temperature Overrides", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const dummyClient = {
    provider: "openai" as const,
    apiFormat: "chat" as const,
    stream: false,
    defaults: {
      temperature: 0.7,
      maxTokens: 4096,
      thinkingBudget: 0,
      extra: {},
    },
  };

  it("applies override temperature when original is undefined or >= 0.4", async () => {
    const chatSpy = vi.spyOn(provider, "chatCompletion").mockResolvedValue({
      content: "response",
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const agent = new DummyAgent({
      client: dummyClient,
      model: "test-model",
      projectRoot: process.cwd(),
      temperature: 1.25, // 覆盖温度
    });

    // 1. 原本未指定温度 (undefined)
    await agent.triggerChat();
    expect(chatSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ temperature: 1.25 })
    );

    // 2. 原本温度为 0.7 (>= 0.4)
    await agent.triggerChat(0.7);
    expect(chatSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ temperature: 1.25 })
    );
  });

  it("does not override low random/certainty temperature (< 0.4) to protect formatting", async () => {
    const chatSpy = vi.spyOn(provider, "chatCompletion").mockResolvedValue({
      content: "response",
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const agent = new DummyAgent({
      client: dummyClient,
      model: "test-model",
      projectRoot: process.cwd(),
      temperature: 1.25, // 覆盖温度
    });

    // 原本温度为 0.3 (低于 0.4 保护阈值)
    await agent.triggerChat(0.3);
    expect(chatSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ temperature: 0.3 })
    );

    // 原本温度为 0 (低于 0.4 保护阈值)
    await agent.triggerChat(0);
    expect(chatSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ temperature: 0 })
    );
  });
});
