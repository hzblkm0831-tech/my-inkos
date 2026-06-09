# InkOS 智能立项与配额调优方案交付文档

本项目已完成全套的**插件化调优**和**智能立项自动化扩展**。以下是全套实施成果与操作说明：

---

## 🛠️ 第一部分：Gemini 3.1 免费配额双重防御方案 (A + B)

为解决高密度的 Agent 并发写作导致 Google AI Studio 免费限额（15 RPM & 6 个突发并发限制）触发 429 报错的问题，我们实现了双保险机制：

### 1. 本地多 Key 轮询代理：[rotating-proxy.js](file:///d:/开发平台/inkos-master/rotating-proxy.js)
- **原理**：本地启动一个监听在端口 `3000` 的原生 Node.js 服务器。内部硬编码轮询您提供的 3 个有效 Gemini Key。
- **效果**：将并发请求均匀稀释，使您的总体并发上限拓展到了 **45 RPM** 与 **18+ 次瞬间突发并发**，完全绕过了单个 Key 的限制。
- **安全性**：敏感 Key 保存于代理脚本中（该文件已加入 `.gitignore` 强力保护，绝不会被推送到您的 GitHub），客户端只需传递伪 Key，确保隐私安全。

### 2. 核心请求层 429 自动指数退避重试：[provider.ts](file:///d:/开发平台/inkos-master/packages/core/src/llm/provider.ts)
- **原理**：在 `chatCompletion` 与 `chatWithTools` 外层包裹了拦截机制，若捕获到 `429` 频率限制或配额超限，自动进行等待重试。
- **策略**：最大重试 5 次，初始等待时间 4000ms（每次重试失败等待延迟自动翻倍，即 4s ➔ 8s ➔ 16s...），在极个别 Key 偶尔出现拥堵时，能自我静默重试恢复。

---

## 🚀 第二部分：一键立项智能向导 (Book Setup Wizard)

为实现**“需求即变量”的一键生成控制设定**，我们在项目中开发了自动化向导脚本：

### 1. 核心文件：[setup-book-wizard.js](file:///d:/开发平台/inkos-master/scripts/setup-book-wizard.js)
- **混合交互模式**：
  * **自动化导入**：支持读取 JSON 配置文件快速一键建书：`node scripts/setup-book-wizard.js <brief.json>`。
  * **交互式问答**：若不加任何参数（`node scripts/setup-book-wizard.js`），脚本会自动启动问答终端，一步步引导您输入书名、主角性格、金手指和风控要求。
- **链式生成机制 (Chained Generation)**：为了防止 AI 生成无约束力的假大空套话，脚本分步生成 4 份文档，前一步的设定直接作为后一步生成的上下文基础：
  1. 生成脱敏并架空势力版的 `story_bible.md`（设定集世界观）。
  2. 生成含硬性战力衰减约束和人设锁定的 `book_rules.md`。
  3. 生成包含长期主线目标的 `author_intent.md` 和前 3 章聚焦的 `current_focus.md`。
- **格式合规自动校验 (Self-Correction)**：对大模型生成的 `book_rules.md` 进行正则与 YAML 解析验证，若 YAML 头部损坏或主角名字对不上，会自动对其发起 Reprompt 修正，最高修正 3 次，防止破损格式破坏 InkOS 运行。
- **直达文件链接门控 (Human Gatekeeper)**：生成完毕后，脚本在控制台**直接输出这四个文件的绝对路径可点击链接**，并在终端强制暂停，等待用户人工查阅、微调数值后再继续立项。

### 2. 简报示例文件：[book_brief.json.example](file:///d:/开发平台/inkos-master/book_brief.json.example)
- 提供包含“商战+两界穿越+风控架空”在内的立项变量 JSON 范本，方便复制和套用。

---

## 📖 第三部分：日常写作运行推荐

当您想要开始写一本新小说时，推荐的最佳流程如下：

1. **第一步：启动本地 3-Key 轮询代理**
   在终端中运行（我们已在您的本地环境将此代理挂起后台）：
   ```bash
   node rotating-proxy.js
   ```
2. **第二步：编写简报变量文件**
   参考 `book_brief.json.example`，新建并编写您自己的新书简报 `my_brief.json`。
3. **第三步：运行向导一键立项**
   ```bash
   node scripts/setup-book-wizard.js my_brief.json
   ```
4. **第四步：人工把关与微调（核心门控）**
   脚本在生成完毕后会暂停。Ctrl+点击终端输出的四个文件链接（如 `book_rules.md`），直接在 VS Code 里微调具体的数值和禁令。确认无误后，在终端敲击回车完成立项。
5. **第五步：开始创作**
   ```bash
   # 为您的新书编译大纲
   node packages/cli/dist/index.js plan chapter "您的书名"
   # 开始运行管线写第一章
   node packages/cli/dist/index.js write next "您的书名"
   ```

*(此交付说明已同步推送到您的 GitHub 个人仓库，且已在 modified 代码文件顶部加注修改日志。)*
