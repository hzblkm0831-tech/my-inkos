# Gemini 3.1 免费配额双重防御方案 (A + B) 实施计划

为解决运行 `inkos write next` 批量写作时触发 Google AI Studio 15 RPM 限制及 6 个短时并发限制造成的 429 报错，我们将实施 **代码层重试机制 (A)** 与 **本地 3-Key 轮询代理服务 (B)** 双重防御体系。

## Proposed Changes

---

### Component: Core LLM Layer (方案 A)

在项目核心模块中添加对 429 (Too Many Requests / Quota Exceeded) 的自动捕获与指数退避重试（Exponential Backoff Retry），确保程序在单 Key 额度抖动时具备高度容错和自恢复能力。

#### [MODIFY] [provider.ts](file:///d:/开发平台/inkos-master/packages/core/src/llm/provider.ts)
- 在 `chatCompletion` 函数体内注入退避重试逻辑，最大重试次数为 5 次，初始等待时间为 4000ms（每次翻倍）。
- 在 `chatWithTools` 函数体内注入同样的退避重试逻辑。
- 保证流式异常（如 `PartialResponseError`）仍然能够向上透传回退。

---

### Component: Local Rotating Proxy (方案 B)

在项目根目录下创建一个高性能、零第三方依赖的本地 API Key 轮询代理脚本 `rotating-proxy.js`。

#### [NEW] [rotating-proxy.js](file:///d:/开发平台/inkos-master/rotating-proxy.js)
- 使用 Node.js 原生 `http` 和 `https` 模块，无需执行 `npm install` 安装其它依赖。
- 本地监听端口 `3000`。
- 内部置入 3 个测试通过的 Gemini API Key，采用轮询算法。
- 支持完整转发 OpenAI 兼容接口的所有 HTTP 请求。
- **支持 Streaming (流式响应)**：将 Google API 返回的 SSE 流（`text/event-stream`）以管道形式实时回传给 InkOS CLI。
- 丢弃请求头中来自 CLI 的 Authorization，替换为轮询选择的真实 Gemini Key：`Authorization: Bearer <SelectedKey>`。

---

## Verification Plan

### Automated & Manual Verification
1. **验证代理与 429 恢复**：
   - 启动本地代理：`node rotating-proxy.js`。
   - 在 `.env` 或配置中将 `INKOS_LLM_BASE_URL` 改为 `http://localhost:3000/v1`。
   - 运行 `inkos doctor` 确认 API 代理畅通。
2. **压力测试**：
   - 使用代理状态下，故意并发执行测试脚本或进行长篇生成，观察代理服务器的 Key 轮询日志是否均衡，并核实 429 触发时客户端是否顺利执行退避并重试成功。
