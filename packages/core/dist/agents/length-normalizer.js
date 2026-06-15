import { BaseAgent } from "./base.js";
import { countChapterLength, chooseNormalizeMode, isOutsideHardRange, isOutsideSoftRange } from "../utils/length-metrics.js";
export class LengthNormalizerAgent extends BaseAgent {
    get name() {
        return "length-normalizer";
    }
    async normalizeChapter(input) {
        const originalCount = countChapterLength(input.chapterContent, input.lengthSpec.countingMode);
        const mode = input.lengthSpec.normalizeMode === "none"
            ? chooseNormalizeMode(originalCount, input.lengthSpec)
            : input.lengthSpec.normalizeMode;
        if (mode === "none") {
            return {
                normalizedContent: input.chapterContent,
                finalCount: originalCount,
                applied: false,
                mode,
            };
        }
        const systemPrompt = this.buildSystemPrompt(mode);
        const userPrompt = this.buildUserPrompt(input, originalCount, mode);
        const response = await this.chat([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ], {
            temperature: 0.2,
            maxTokens: Math.max(4096, Math.ceil(originalCount * 1.2)),
        });
        const normalizedContent = this.sanitizeNormalizedContent(response.content, input.chapterContent);
        const finalCount = countChapterLength(normalizedContent, input.lengthSpec.countingMode);
        const warning = this.buildWarning(finalCount, input.lengthSpec);
        return {
            normalizedContent,
            finalCount,
            applied: true,
            mode,
            warning,
            tokenUsage: response.usage,
        };
    }
    buildSystemPrompt(mode) {
        const action = mode === "compress"
            ? "compress"
            : "expand";
        return `你是一位章节长度修正器。你的任务是对章节正文做一次单次修正，只能执行一次，不得递归重写。

修正目标：
- ${action} 章节长度到给定目标区间
- 保留章节原有事实、关键钩子、角色名和必须保留的标记
- 不要引入新的支线、未来揭示或额外总结
- 不要在正文外输出任何解释`;
    }
    buildUserPrompt(input, originalCount, mode) {
        const intentBlock = input.chapterIntent
            ? `\n## Chapter Intent\n${input.chapterIntent}\n`
            : "";
        const controlBlock = input.reducedControlBlock
            ? `\n## Reduced Control Block\n${input.reducedControlBlock}\n`
            : "";
        return `请对下面正文做一次${mode === "compress" ? "压缩" : "扩写"}修正。

## Length Spec
- Target: ${input.lengthSpec.target}
- Soft Range: ${input.lengthSpec.softMin}-${input.lengthSpec.softMax}
- Hard Range: ${input.lengthSpec.hardMin}-${input.lengthSpec.hardMax}
- Counting Mode: ${input.lengthSpec.countingMode}

## Current Count
${originalCount}

## Correction Rules
- 只修正一次，不要递归
- 保留正文中的关键标记、人物名、地点名和已有事实
- 不要凭空新增子情节
- 不要插入解释性总结或分析
- 输出修正后的完整正文，不要加标签

${intentBlock}${controlBlock}
## Chapter Content
${input.chapterContent}`;
    }
    buildWarning(finalCount, lengthSpec) {
        if (!isOutsideSoftRange(finalCount, lengthSpec)) {
            return undefined;
        }
        if (isOutsideHardRange(finalCount, lengthSpec)) {
            return `Final count ${finalCount} is outside the hard range ${lengthSpec.hardMin}-${lengthSpec.hardMax} after one normalization pass.`;
        }
        return `Final count ${finalCount} is outside the soft range ${lengthSpec.softMin}-${lengthSpec.softMax} after one normalization pass.`;
    }
    sanitizeNormalizedContent(rawContent, fallbackContent) {
        const trimmed = rawContent.trim();
        if (!trimmed)
            return fallbackContent;
        const fenced = this.extractFirstFencedBlock(trimmed);
        if (fenced)
            return fenced;
        const stripped = this.stripCommonWrappers(trimmed);
        if (stripped !== undefined) {
            // Empty after stripping = response was only wrapper text, use original
            if (!stripped)
                return fallbackContent;
            // Guard: if stripping removed more than 50% of content, the regex was too aggressive.
            if (stripped.length < trimmed.length * 0.5)
                return trimmed;
            return stripped;
        }
        return trimmed;
    }
    extractFirstFencedBlock(content) {
        const match = content.match(/```(?:[a-zA-Z-]+)?\s*\n([\s\S]*?)\n```/);
        if (!match)
            return undefined;
        const body = match[1]?.trim();
        return body ? body : undefined;
    }
    stripCommonWrappers(content) {
        const lines = content.split("\n");
        let removedAny = false;
        const keptLines = [];
        for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (this.isWrapperLine(trimmed)) {
                removedAny = true;
                continue;
            }
            keptLines.push(rawLine);
        }
        if (!removedAny) {
            return undefined;
        }
        return keptLines.join("\n").trim();
    }
    isWrapperLine(line) {
        if (!line)
            return false;
        if (/^```/.test(line))
            return true;
        if (/^#+\s*(说明|解释|注释|analysis|analysis note)\b/i.test(line))
            return true;
        if (/^(下面是|以下是).*(正文|章节|压缩|扩写|修正|修改|调整|改写|润色|结果|内容|输出|版本)/i.test(line)) {
            return true;
        }
        if (/^我先.*(压缩|扩写|修正|修改|调整|改写|润色|处理).*(正文|章节)?/i.test(line)) {
            return true;
        }
        if (/^(here(?:'s| is)|below is).*(chapter|draft|content|rewrite|revised|compressed|expanded|normalized|adjusted|output|version|result)/i.test(line)) {
            return true;
        }
        if (/^i(?:'ll| will)\s+(rewrite|revise|reword|compress|expand|normalize|adjust|shorten|lengthen|trim|fix)\b/i.test(line)) {
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=length-normalizer.js.map