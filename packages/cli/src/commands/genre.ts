import { Command } from "commander";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { listAvailableGenres, readGenreProfile, getBuiltinGenresDir, loadProjectConfig, createLLMClient, chatCompletion } from "@actalk/inkos-core";
import { findProjectRoot, log, logError } from "../utils.js";


export const genreCommand = new Command("genre")
  .description("Manage genre profiles");

genreCommand
  .command("list")
  .description("List all available genre profiles (built-in + project)")
  .action(async () => {
    try {
      const root = findProjectRoot();
      const genres = await listAvailableGenres(root);

      if (genres.length === 0) {
        log("No genre profiles found.");
        return;
      }

      log("Available genres:\n");
      for (const g of genres) {
        const tag = g.source === "project" ? "[project]" : "[builtin]";
        log(`  ${g.id.padEnd(12)} ${g.name.padEnd(8)} ${tag}`);
      }
      log(`\nTotal: ${genres.length} genre(s)`);
    } catch (e) {
      logError(`Failed to list genres: ${e}`);
      process.exit(1);
    }
  });

genreCommand
  .command("show")
  .description("Display a genre profile")
  .argument("<id>", "Genre ID (e.g. xuanhuan, urban, horror)")
  .action(async (id: string) => {
    try {
      const root = findProjectRoot();
      const genres = await listAvailableGenres(root);
      const exactMatch = genres.some(g => g.id === id);
      if (!exactMatch) {
        logError(`Genre "${id}" not found. Available: ${genres.map(g => g.id).join(", ")}`);
        process.exit(1);
      }
      const { profile, body } = await readGenreProfile(root, id);

      log(`Genre: ${profile.name} (${profile.id})\n`);
      log(`  Chapter types:      ${profile.chapterTypes.join(", ")}`);
      log(`  Fatigue words:      ${profile.fatigueWords.join(", ")}`);
      log(`  Numerical system:   ${profile.numericalSystem}`);
      log(`  Power scaling:      ${profile.powerScaling}`);
      log(`  Era research:       ${profile.eraResearch}`);
      log(`  Pacing rule:        ${profile.pacingRule}`);
      log(`  Satisfaction types: ${profile.satisfactionTypes.join(", ")}`);
      log(`  Audit dimensions:   ${profile.auditDimensions.join(", ")}`);

      if (body) {
        log(`\n--- Body ---\n${body}`);
      }
    } catch (e) {
      logError(`Failed to show genre: ${e}`);
      process.exit(1);
    }
  });

genreCommand
  .command("create")
  .description("Scaffold a new genre profile in the project genres/ directory")
  .argument("<id>", "Genre ID (e.g. scifi, wuxia, romance)")
  .option("--name <name>", "Genre display name", "")
  .option("--numerical", "Enable numerical system", false)
  .option("--power", "Enable power scaling", false)
  .option("--era", "Enable era research", false)
  .action(async (id: string, opts) => {
    try {
      const root = findProjectRoot();
      const genresDir = join(root, "genres");
      const filePath = join(genresDir, `${id}.md`);

      // Check if already exists
      try {
        await readFile(filePath, "utf-8");
        logError(`Genre profile already exists: ${filePath}`);
        process.exit(1);
      } catch { /* file doesn't exist, good */ }

      await mkdir(genresDir, { recursive: true });

      const name = opts.name || id;
      const template = `---
name: ${name}
id: ${id}
chapterTypes: ["推进章", "布局章", "过渡章", "回收章"]
fatigueWords: ["震惊", "不可思议", "难以置信"]
numericalSystem: ${opts.numerical}
powerScaling: ${opts.power}
eraResearch: ${opts.era}
pacingRule: "每2-3章有一个明确的进展或反馈"
satisfactionTypes: ["目标达成", "困难克服", "真相揭示"]
auditDimensions: [1,2,3,6,7,8,9,10,13,14,15,16,17,18,19]
---

## 题材禁忌

- (根据题材添加禁忌)

## 叙事指导

(根据题材描述叙事重心和风格要求)
`;

      await writeFile(filePath, template, "utf-8");
      log(`Created genre profile: ${filePath}`);
      log(`Edit the file to customize chapter types, fatigue words, rules, etc.`);
    } catch (e) {
      logError(`Failed to create genre: ${e}`);
      process.exit(1);
    }
  });

genreCommand
  .command("copy")
  .description("Copy a built-in genre profile to project for customization")
  .argument("<id>", "Genre ID to copy (e.g. xuanhuan)")
  .action(async (id: string) => {
    try {
      const root = findProjectRoot();
      const builtinDir = getBuiltinGenresDir();
      const srcPath = join(builtinDir, `${id}.md`);
      const genresDir = join(root, "genres");
      const destPath = join(genresDir, `${id}.md`);

      // Check if project override already exists
      try {
        await readFile(destPath, "utf-8");
        logError(`Project genre profile already exists: ${destPath}`);
        process.exit(1);
      } catch { /* doesn't exist, good */ }

      let content: string;
      try {
        content = await readFile(srcPath, "utf-8");
      } catch {
        logError(`Built-in genre "${id}" not found. Use 'inkos genre list' to see available genres.`);
        process.exit(1);
        return;
      }

      await mkdir(genresDir, { recursive: true });
      await writeFile(destPath, content, "utf-8");
      log(`Copied to: ${destPath}`);
      log(`This project-level copy will override the built-in profile.`);
    } catch (e) {
      logError(`Failed to copy genre: ${e}`);
      process.exit(1);
    }
  });

genreCommand
  .command("extract")
  .description("Automatically reverse-engineer a new genre profile from a raw text novel sample")
  .argument("<sample_path>", "Path to the raw text sample file (.txt or .md)")
  .option("--genre <id>", "Genre ID to write (e.g. custom_xianxia)", "")
  .option("--name <name>", "Genre display name", "")
  .action(async (samplePath: string, opts) => {
    try {
      const root = findProjectRoot();
      
      // 1. Read and truncate sample text if necessary
      let sampleText = "";
      try {
        sampleText = await readFile(samplePath, "utf-8");
      } catch {
        logError(`Failed to read sample file at: ${samplePath}`);
        process.exit(1);
      }

      if (sampleText.trim().length === 0) {
        logError(`Sample file is empty: ${samplePath}`);
        process.exit(1);
      }

      const maxChars = 15000;
      if (sampleText.length > maxChars) {
        log(`[Warning] Sample file is too large (${sampleText.length} chars). Truncating to first ${maxChars} chars to prevent API limit issues.`);
        sampleText = sampleText.slice(0, maxChars);
      }

      // 2. Load project config and initialize LLM
      log("Loading LLM configurations from inkos.json...");
      const config = await loadProjectConfig(root);
      const client = createLLMClient(config.llm);
      const model = config.llm.defaultModel || "gemini-3.1-flash-lite";

      const id = opts.genre || "custom_extracted_" + Math.random().toString(36).slice(2, 6);
      const displayName = opts.name || id;

      log(`Analyzing text sample using model ${model}... (this might take a few seconds)`);

      const systemPrompt = `你是一个专业的网文总编辑，擅长从爆款网文中解构其底层的“创作算法”与“规则体系”。
请分析用户提供的小说文本样本（前三章或高潮冲突章），并将其逆向解构，输出为一个符合 InkOS 题材配置文件（Genre Profile）格式的 Markdown 文档。

输出格式必须严格遵循以下结构，开头必须是 \`---\` 包裹的 YAML frontmatter，后面跟着 Markdown 题材禁忌与叙事指导：

---
name: ${displayName}
id: ${id}
chapterTypes: ["章节类型1", "章节类型2", "章节类型3", "章节类型4"]
fatigueWords: ["AI高频词1", "AI高频词2", "AI高频词3"]
numericalSystem: false
powerScaling: false
eraResearch: false
pacingRule: "每章结尾必须有一个悬念钩子，每2-3章完成一次局部爽点反馈"
satisfactionTypes: ["爽点1", "爽点2"]
auditDimensions: [1,2,3,6,7,8,9,10,13,14,15,16,17,18,19]
---

## 题材禁忌

- [请从小说样本中提取出作者绝对没有犯下的毒点、以及极力避免的套路桥段，3-5条]
- ...

## 叙事指导

- [请从小说样本中分析出作者如何控制主角的性格边界、如何表现战力/气势、以及具体的语言文风习惯，3-5条]
- ...

【CRITICAL RULES】
1. 只输出这个符合格式的 Markdown 文件内容本身，严禁包含任何前言、后记或额外的解释段落。
2. 绝对不要用 \`\`\`markdown ... \`\`\` 块包裹你的输出，直接从第一行的 \`---\` 开始输出。
3. 请合理推断该题材是否包含“数值系统(numericalSystem)”、“战力等级(powerScaling)”或“年代考据(eraResearch)”，并将其在 frontmatter 中设为 true 或 false。
4. 搜集样本中那些显得陈词滥调、AI感十足或灌水严重的疲劳词，写入 fatigueWords。`;

      const response = await chatCompletion(client, model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: `这是小说样本章节文本，请为我执行逆向解构：\n\n${sampleText}` }
      ], { temperature: 0.5 });

      let outputContent = response.content.trim();
      
      // Clean up markdown code block wrapping if LLM ignored instructions
      outputContent = outputContent.replace(/^```(?:md|markdown|yaml)?\s*\n/, "").replace(/\n```\s*$/, "").trim();

      if (!outputContent.startsWith("---")) {
        logError("Analysis failed: LLM response did not start with standard YAML frontmatter.");
        log(`Raw output was:\n${outputContent.slice(0, 500)}...`);
        process.exit(1);
      }

      // 3. Save extracted genre md file
      const genresDir = join(root, "genres");
      await mkdir(genresDir, { recursive: true });
      const destPath = join(genresDir, `${id}.md`);

      await writeFile(destPath, outputContent, "utf-8");
      log(`[Success] Genre profile extracted and saved to: ${destPath}`);
      log(`You can now use this genre by editing your book.json config to: "genre": "${id}"`);
      log(`Don't forget to run 'inkos book update' to reload configs.`);
      
    } catch (e) {
      logError(`Failed to extract genre: ${e}`);
      process.exit(1);
    }
  });

