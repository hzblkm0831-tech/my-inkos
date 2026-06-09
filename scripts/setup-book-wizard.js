const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// 本地代理 API 配置
const API_URL = 'http://localhost:3000/v1/chat/completions';
const MODEL = 'gemini-3.1-flash-lite';

// === 辅助工具函数 ===
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callLLM(systemPrompt, userPrompt, temperature = 0.3) {
  let attempt = 0;
  const maxRetries = 3;
  while (true) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-key'
        },
        body: JSON.stringify({
          model: MODEL,
          temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      console.warn(`[向导] 调用大模型失败，将在 ${2000 * attempt}ms 后重试...`);
      await sleep(2000 * attempt);
    }
  }
}

// 终端问答交互封装
function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// 提取并校验 book_rules.md Front-matter
function validateBookRules(content, protagonistName) {
  const parts = content.split('---');
  if (parts.length < 3) {
    return { ok: false, reason: "Front-matter 格式损坏，缺少首尾的 '---' 分割线" };
  }
  
  const yaml = parts[1];
  
  if (!yaml.includes('protagonist:')) {
    return { ok: false, reason: "缺少 'protagonist:' 人设锁定声明" };
  }
  
  // 主角名字软匹配（去除引号干扰）
  const nameClean = protagonistName.trim();
  const hasName = yaml.includes(`name: "${nameClean}"`) 
    || yaml.includes(`name: '${nameClean}'`) 
    || yaml.includes(`name: ${nameClean}`);
    
  if (!hasName) {
    return { ok: false, reason: `YAML中锁定的主角名字与配置不匹配，期望为: "${nameClean}"` };
  }
  
  if (!yaml.includes('sensitiveWords:')) {
    return { ok: false, reason: "缺少 'sensitiveWords:' 平台风控敏感词配置" };
  }
  
  return { ok: true };
}

// === 主体流控制 ===
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n======================================================`);
  console.log(`🚀 欢迎使用 InkOS 一键立项智能向导 (Book Setup Wizard)`);
  console.log(`======================================================\n`);

  let brief = null;

  // 1. 判断是否传入了配置文件 (混合交互模式)
  const argFile = process.argv[2];
  if (argFile) {
    console.log(`[向导] 检测到配置文件: ${argFile}`);
    try {
      const raw = fs.readFileSync(path.resolve(argFile), 'utf-8');
      brief = JSON.parse(raw);
      console.log(`🟢 成功导入立项简报：书籍《${brief.title}》已就绪。\n`);
    } catch (err) {
      console.error(`🔴 读取配置文件失败: ${err.message}`);
      rl.close();
      process.exit(1);
    }
  } else {
    // 交互式问答模式
    console.log(`[向导] 未传入配置文件，已进入交互式问答模式。请依次填写：\n`);
    const title = await askQuestion(rl, `👉 1. 请输入书籍名称: `);
    const genre = await askQuestion(rl, `👉 2. 请输入核心题材代号 (例如: urban, xianxia, litrpg): `);
    const style = await askQuestion(rl, `👉 3. 请输入期望模仿的网文作家文风 (例如: 网文作家“开荒”风格...): `);
    const protName = await askQuestion(rl, `👉 4. 请输入主角名字: `);
    const protBg = await askQuestion(rl, `👉 5. 请输入主角的背景设定: `);
    const protPers = await askQuestion(rl, `👉 6. 请输入主角的核心人设基调: `);
    const goldFinger = await askQuestion(rl, `👉 7. 请详细描述金手指的道具/能力及限制: `);
    const ultimateGoal = await askQuestion(rl, `👉 8. 请输入故事的终极博弈目标: `);
    const safety = await askQuestion(rl, `👉 9. 请说明平台风控及架空脱敏要求 (例如: 地名架空...): `);
    
    brief = {
      title: title || "未命名新书",
      genre: genre || "other",
      style: style || "通俗网络小说风格",
      protagonist: {
        name: protName || "林源",
        background: protBg || "普通人背景",
        personality: protPers || "理智，果断"
      },
      goldFinger: goldFinger || "无特殊金手指",
      ultimateGoal: ultimateGoal || "成为强者",
      safetyControl: safety || "架空背景，避免敏感词"
    };
    
    console.log(`\n🟢 收集信息成功！已生成临时简报。《${brief.title}》立项管线启动。\n`);
  }

  // 2. 自动调用 CLI 初始化书籍目录
  console.log(`[向导] 正在调用 InkOS CLI 创建书籍骨架...`);
  let bookId = '';
  try {
    // 运行 CLI 命令
    const cliPath = path.resolve(__dirname, '../packages/cli/dist/index.js');
    const cliCommand = `node "${cliPath}" book create --title "${brief.title}" --genre "${brief.genre}"`;
    const execOut = execSync(cliCommand, { encoding: 'utf-8', stdio: 'pipe' });
    
    // 从输出中猜测 bookId
    // 兼容可能为书名或自动生成的 ID
    bookId = brief.title;
    console.log(`🟢 书籍骨架创建成功，位置：books/${bookId}/\n`);
  } catch (err) {
    console.error(`🔴 调用 CLI 创建书籍骨架失败: ${err.message}`);
    if (err.stdout) console.log(err.stdout);
    rl.close();
    process.exit(1);
  }

  const bookStoryDir = path.resolve(__dirname, `../books/${bookId}/story`);
  if (!fs.existsSync(bookStoryDir)) {
    console.error(`🔴 找不到书籍故事目录：${bookStoryDir}，请确认 CLI 是否正确执行。`);
    rl.close();
    process.exit(1);
  }

  // 3. 开始链式生成 (Chained Generation)
  
  // --- Step 1: 生成 story_bible.md ---
  console.log(`[向导] [1/3] 正在生成设定集与世界观 (story_bible.md)...`);
  const sbSystem = `你是一位网络小说主编与大纲设定专家。请为新书《${brief.title}》生成一份深度设定集与世界观（story_bible.md）。
你的输出必须结构严密、逻辑严洽，并且严格遵循以下脱敏架空规则：
- 终极风控：${brief.safetyControl}
- 绝对禁止使用任何真实地缘政治名词（如中国、美国、日本、俄罗斯、五常等）。

必须包含以下章节结构：
# 设定集与世界观

## 一、 势力与地缘版图（平行现实世界 - 规避风控架空版）
详细描述主要国家/势力、主角起步的自由港/灰色治安洼地。

## 二、 目标实体设定（地缘博弈焦点）
详细描述林源最终要建立的庞大实体（满足主角目标：${brief.ultimateGoal}）。

## 三、 超凡/末日世界（金手指关联界）
结合主角的金手指《${brief.goldFinger}》展开描述对立世界的环境、特产资源和生态现状。`;

  const sbUser = `以下是立项简报：
书名: ${brief.title}
题材: ${brief.genre}
主角: ${brief.protagonist.name} (${brief.protagonist.background})
最终目标: ${brief.ultimateGoal}`;

  const storyBibleContent = await callLLM(sbSystem, sbUser);
  const sbPath = path.join(bookStoryDir, 'story_bible.md');
  fs.writeFileSync(sbPath, storyBibleContent, 'utf-8');
  console.log(`🟢 story_bible.md 写入成功。`);

  // --- Step 2: 生成 book_rules.md (含 Front-matter 校验与纠错) ---
  console.log(`\n[向导] [2/3] 正在生成书籍硬性写作规则 (book_rules.md)...`);
  const brSystem = `你是一位严苛的网络小说总编辑。请为新书《${brief.title}》生成硬性写作规则（book_rules.md）。
该文件必须包含 Front-matter (被两个 '---' 分割线包裹的 YAML 头部)，格式必须与以下模板完全一致：

---
# 书级人设锁定
protagonist:
  name: "${brief.protagonist.name}"
  personalityLock: ["性格特质1", "性格特质2"]
  behavioralConstraints: 
    - "行为约束1"
    - "行为约束2"

# 引入额外的审计维度
additionalAuditDimensions:
  - 4   # 战力崩坏检查
  - 5   # 数值检查
  - 11  # 利益链断裂
  - 18  # 知识库污染

# 敏感词规避与风控
sensitiveWords: ["敏感词1", "敏感词2"]
---

## 题材与数值铁律
- 制定金手指《${brief.goldFinger}》在跨界、物理法则上的核心衰减数值约束，严禁主角无痛无代价变强。
- 制定符合文风《${brief.style}》的商战与地缘博弈逻辑约束，绝对禁止弱智反派，要求配角和势力符合利益逻辑。
- 制定文风规范，例如严禁的表达、AI腔调过滤等。`;

  const brUser = `以下是已生成的世界观背景，请作为依据：
${storyBibleContent}`;

  let bookRulesContent = '';
  let isValid = false;
  let retryCount = 0;
  const maxRetries = 3;

  while (!isValid && retryCount < maxRetries) {
    bookRulesContent = await callLLM(brSystem, brUser);
    const check = validateBookRules(bookRulesContent, brief.protagonist.name);
    
    if (check.ok) {
      isValid = true;
    } else {
      retryCount++;
      console.warn(`⚠️ [格式校验失败] 第 ${retryCount} 次尝试。原因：${check.reason}。正在重新引导模型生成...`);
      // 重新构造 prompt 进行引导修正
      const correctionPrompt = `你的上一次输出格式不符合要求，原因：${check.reason}。请重新生成，并确保首尾由 '---' 包裹，protagonist 下的 name 精确等于 "${brief.protagonist.name}"，且包含 sensitiveWords 列表配置。`;
      bookRulesContent = await callLLM(brSystem, brUser + `\n\n[纠错指令]\n${correctionPrompt}`);
    }
  }

  if (!isValid) {
    console.error(`🔴 连续 ${maxRetries} 次格式校验失败，将写入最后一次生成结果，请您在稍后的【人工把关环节】中手动调整。`);
  }

  const brPath = path.join(bookStoryDir, 'book_rules.md');
  fs.writeFileSync(brPath, bookRulesContent, 'utf-8');
  console.log(`🟢 book_rules.md 写入成功。`);

  // --- Step 3: 生成 author_intent.md 与 current_focus.md ---
  console.log(`\n[向导] [3/3] 正在生成作者长期意图与前三章阶段性焦点...`);
  const intentSystem = `你是一位网络小说长线大纲架构师。请为新书《${brief.title}》生成长期创作意图 (author_intent.md)。
内容必须提炼核心主线和最终愿景（成长为：${brief.ultimateGoal}）。
必须以 Markdown 的大标题 '# 长期创作意图 (Author Intent)' 开头。`;
  
  const intentUser = `简报信息：
金手指: ${brief.goldFinger}
终极目标: ${brief.ultimateGoal}`;

  const authorIntentContent = await callLLM(intentSystem, intentUser);
  const aiPath = path.join(bookStoryDir, 'author_intent.md');
  fs.writeFileSync(aiPath, authorIntentContent, 'utf-8');
  console.log(`🟢 author_intent.md 写入成功。`);

  const focusSystem = `你是一位网络小说章节规划专家。请为新书《${brief.title}》规划前 3 章的阶段性具体焦点 (current_focus.md)。
结合文风风格《${brief.style}》，详细规划：
- 第 1 章（危机与金手指觉醒细节，主角的动机交代）
- 第 2 章（探索与第一批超凡资源的价值获取）
- 第 3 章（现实中的商业起步与首个同盟）
必须以 Markdown 的大标题 '# 当前 1-3 章聚焦 (Current Focus)' 开头。`;

  const focusUser = `主角设定: ${brief.protagonist.name} - ${brief.protagonist.background}
已生成的世界观:
${storyBibleContent}`;

  const currentFocusContent = await callLLM(focusSystem, focusUser);
  const cfPath = path.join(bookStoryDir, 'current_focus.md');
  fs.writeFileSync(cfPath, currentFocusContent, 'utf-8');
  console.log(`🟢 current_focus.md 写入成功。`);

  // 4. 人工把关门控 (Human Gatekeeper)
  console.log(`\n======================================================`);
  console.log(`⚠️  🎉 [人工校准门控] 4 份核心控制文档已成功自动生成！`);
  console.log(`======================================================`);
  console.log(`请您务必打开以下文件，点击链接以检查、微调数值和确认规则：\n`);
  
  // 转换成绝对路径的可点击链接
  const fileLink = (filePath) => `file:///${filePath.replace(/\\/g, '/')}`;
  
  console.log(`1. 世界观设定集:   [story_bible.md](${fileLink(sbPath)})`);
  console.log(`2. 写作数值与规约束: [book_rules.md](${fileLink(brPath)})`);
  console.log(`3. 作者长期意图:   [author_intent.md](${fileLink(aiPath)})`);
  console.log(`4. 前三章阶段聚焦:  [current_focus.md](${fileLink(cfPath)})`);
  
  console.log(`\n在您对配置文件完成审阅、修改并确认无误后，请输入 'Y' 或直接按回车以确认立项完成...`);
  
  await askQuestion(rl, `👉 [等待您的确认]: `);
  
  console.log(`\n======================================================`);
  console.log(`🟢 立项完成！书籍《${brief.title}》已准备好开始写作。`);
  console.log(`您可以直接运行：node packages/cli/dist/index.js write next "${bookId}" 开始写第一章！`);
  console.log(`======================================================\n`);
  
  rl.close();
}

main().catch((err) => {
  console.error(`🔴 向导执行发生致命错误: ${err.stack}`);
  process.exit(1);
});
