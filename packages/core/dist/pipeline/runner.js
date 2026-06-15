import { chatCompletion, createLLMClient } from "../llm/provider.js";
import { ArchitectAgent } from "../agents/architect.js";
import { FoundationReviewerAgent } from "../agents/foundation-reviewer.js";
import { PlannerAgent } from "../agents/planner.js";
import { ComposerAgent } from "../agents/composer.js";
import { WriterAgent } from "../agents/writer.js";
import { LengthNormalizerAgent } from "../agents/length-normalizer.js";
import { ChapterAnalyzerAgent } from "../agents/chapter-analyzer.js";
import { ContinuityAuditor } from "../agents/continuity.js";
import { ReviserAgent, DEFAULT_REVISE_MODE } from "../agents/reviser.js";
import { StateValidatorAgent } from "../agents/state-validator.js";
import { RadarAgent } from "../agents/radar.js";
import { readGenreProfile } from "../agents/rules-reader.js";
import { analyzeAITells } from "../agents/ai-tells.js";
import { analyzeSensitiveWords } from "../agents/sensitive-words.js";
import { StateManager } from "../state/manager.js";
import { MemoryDB } from "../state/memory-db.js";
import { dispatchNotification, dispatchWebhookEvent } from "../notify/dispatcher.js";
import { buildLengthSpec, countChapterLength, formatLengthCount, isOutsideHardRange, isOutsideSoftRange, resolveLengthCountingMode } from "../utils/length-metrics.js";
import { analyzeLongSpanFatigue } from "../utils/long-span-fatigue.js";
import { loadNarrativeMemorySeed, loadSnapshotCurrentStateFacts } from "../state/runtime-state-store.js";
import { rewriteStructuredStateFromMarkdown } from "../state/state-bootstrap.js";
import { readFile, readdir, writeFile, mkdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseStateDegradedReviewNote, resolveStateDegradedBaseStatus, retrySettlementAfterValidationFailure, } from "./chapter-state-recovery.js";
import { persistChapterArtifacts } from "./chapter-persistence.js";
import { runChapterReviewCycle } from "./chapter-review-cycle.js";
import { validateChapterTruthPersistence } from "./chapter-truth-validation.js";
import { loadPersistedPlan, relativeToBookDir } from "./persisted-governed-plan.js";
const SEQUENCE_LEVEL_CATEGORIES = new Set([
    "Pacing Monotony", "节奏单调",
    "Mood Monotony", "情绪单调",
    "Title Collapse", "标题重复",
    "Title Clustering", "标题聚集",
    "Opening Pattern Repetition", "开头同构",
    "Ending Pattern Repetition", "结尾同构",
]);
function isSequenceLevelCategory(category) {
    return SEQUENCE_LEVEL_CATEGORIES.has(category);
}
export class PipelineRunner {
    state;
    config;
    agentClients = new Map();
    memoryIndexFallbackWarned = false;
    constructor(config) {
        this.config = config;
        this.state = new StateManager(config.projectRoot);
    }
    localize(language, messages) {
        return language === "en" ? messages.en : messages.zh;
    }
    async resolveBookLanguage(book) {
        if (book.language) {
            return book.language;
        }
        try {
            const { profile } = await this.loadGenreProfile(book.genre);
            return profile.language;
        }
        catch {
            return "zh";
        }
    }
    async resolveBookLanguageById(bookId) {
        try {
            const book = await this.state.loadBookConfig(bookId);
            return await this.resolveBookLanguage(book);
        }
        catch {
            return "zh";
        }
    }
    languageFromLengthSpec(lengthSpec) {
        return lengthSpec.countingMode === "en_words" ? "en" : "zh";
    }
    logStage(language, message) {
        this.config.logger?.info(`${this.localize(language, { zh: "阶段：", en: "Stage: " })}${this.localize(language, message)}`);
    }
    logInfo(language, message) {
        this.config.logger?.info(this.localize(language, message));
    }
    logWarn(language, message) {
        this.config.logger?.warn(this.localize(language, message));
    }
    async tryGenerateStyleGuide(bookId, referenceText, sourceName, language) {
        try {
            await this.generateStyleGuide(bookId, referenceText, sourceName);
        }
        catch (error) {
            const resolvedLanguage = language ?? await this.resolveBookLanguageById(bookId);
            const detail = error instanceof Error ? error.message : String(error);
            this.logWarn(resolvedLanguage, {
                zh: `风格指纹提取失败，已跳过：${detail}`,
                en: `Style fingerprint extraction failed and was skipped: ${detail}`,
            });
        }
    }
    async generateAndReviewFoundation(params) {
        const maxRetries = params.maxRetries ?? 2;
        let foundation = await params.generate();
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            this.logStage(params.stageLanguage, {
                zh: `审核基础设定（第${attempt + 1}轮）`,
                en: `reviewing foundation (round ${attempt + 1})`,
            });
            const review = await params.reviewer.review({
                foundation,
                mode: params.mode,
                sourceCanon: params.sourceCanon,
                styleGuide: params.styleGuide,
                language: params.language,
            });
            this.config.logger?.info(`Foundation review: ${review.totalScore}/100 ${review.passed ? "PASSED" : "REJECTED"}`);
            for (const dim of review.dimensions) {
                this.config.logger?.info(`  [${dim.score}] ${dim.name.slice(0, 40)}`);
            }
            if (review.passed) {
                return foundation;
            }
            this.logWarn(params.stageLanguage, {
                zh: `基础设定未通过审核（${review.totalScore}分），正在重新生成...`,
                en: `Foundation rejected (${review.totalScore}/100), regenerating...`,
            });
            foundation = await params.generate(this.buildFoundationReviewFeedback(review, params.language));
        }
        // Final review
        const finalReview = await params.reviewer.review({
            foundation,
            mode: params.mode,
            sourceCanon: params.sourceCanon,
            styleGuide: params.styleGuide,
            language: params.language,
        });
        this.config.logger?.info(`Foundation final review: ${finalReview.totalScore}/100 ${finalReview.passed ? "PASSED" : "ACCEPTED (max retries)"}`);
        return foundation;
    }
    buildFoundationReviewFeedback(review, language) {
        const dimensionLines = review.dimensions
            .map((dimension) => (language === "en"
            ? `- ${dimension.name} [${dimension.score}]: ${dimension.feedback}`
            : `- ${dimension.name}（${dimension.score}分）：${dimension.feedback}`))
            .join("\n");
        return language === "en"
            ? [
                "## Overall Feedback",
                review.overallFeedback,
                "",
                "## Dimension Notes",
                dimensionLines || "- none",
            ].join("\n")
            : [
                "## 总评",
                review.overallFeedback,
                "",
                "## 分项问题",
                dimensionLines || "- 无",
            ].join("\n");
    }
    agentCtx(bookId) {
        return {
            client: this.config.client,
            model: this.config.model,
            projectRoot: this.config.projectRoot,
            bookId,
            logger: this.config.logger,
            onStreamProgress: this.config.onStreamProgress,
        };
    }
    resolveOverride(agentName) {
        const override = this.config.modelOverrides?.[agentName];
        if (!override) {
            return { model: this.config.model, client: this.config.client };
        }
        if (typeof override === "string") {
            return { model: override, client: this.config.client };
        }
        // Full override — needs its own client if baseUrl differs
        if (!override.baseUrl) {
            return { model: override.model, client: this.config.client };
        }
        const base = this.config.defaultLLMConfig;
        const provider = override.provider ?? base?.provider ?? "custom";
        const apiKeySource = override.apiKeyEnv
            ? `env:${override.apiKeyEnv}`
            : `base:${base?.apiKey ?? ""}`;
        const stream = override.stream ?? base?.stream ?? true;
        const apiFormat = base?.apiFormat ?? "chat";
        const cacheKey = [
            provider,
            override.baseUrl,
            apiKeySource,
            `stream:${stream}`,
            `format:${apiFormat}`,
        ].join("|");
        let client = this.agentClients.get(cacheKey);
        if (!client) {
            const apiKey = override.apiKeyEnv
                ? process.env[override.apiKeyEnv] ?? ""
                : base?.apiKey ?? "";
            client = createLLMClient({
                provider,
                baseUrl: override.baseUrl,
                apiKey,
                model: override.model,
                temperature: base?.temperature ?? 0.7,
                maxTokens: base?.maxTokens ?? 8192,
                thinkingBudget: base?.thinkingBudget ?? 0,
                apiFormat,
                stream,
            });
            this.agentClients.set(cacheKey, client);
        }
        return { model: override.model, client };
    }
    agentCtxFor(agent, bookId) {
        const { model, client } = this.resolveOverride(agent);
        return {
            client,
            model,
            projectRoot: this.config.projectRoot,
            bookId,
            logger: this.config.logger?.child(agent),
            onStreamProgress: this.config.onStreamProgress,
        };
    }
    async pathExists(path) {
        try {
            await stat(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async loadGenreProfile(genre) {
        const parsed = await readGenreProfile(this.config.projectRoot, genre);
        return { profile: parsed.profile };
    }
    // ---------------------------------------------------------------------------
    // Atomic operations (composable by OpenClaw or agent mode)
    // ---------------------------------------------------------------------------
    async runRadar() {
        const radar = new RadarAgent(this.agentCtxFor("radar"), this.config.radarSources);
        return radar.scan();
    }
    async initBook(book, options = {}) {
        const architect = new ArchitectAgent(this.agentCtxFor("architect", book.id));
        const bookDir = this.state.bookDir(book.id);
        const stagingBookDir = join(this.state.booksDir, `.tmp-book-create-${book.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
        const stageLanguage = await this.resolveBookLanguage(book);
        this.logStage(stageLanguage, { zh: "生成基础设定", en: "generating foundation" });
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const reviewer = new FoundationReviewerAgent(this.agentCtxFor("foundation-reviewer", book.id));
        const resolvedLanguage = (book.language ?? gp.language) === "en" ? "en" : "zh";
        const foundation = await this.generateAndReviewFoundation({
            generate: (reviewFeedback) => architect.generateFoundation(book, options.externalContext ?? this.config.externalContext, reviewFeedback),
            reviewer,
            mode: "original",
            language: resolvedLanguage,
            stageLanguage,
        });
        try {
            this.logStage(stageLanguage, { zh: "保存书籍配置", en: "saving book config" });
            await this.state.saveBookConfigAt(stagingBookDir, book);
            this.logStage(stageLanguage, { zh: "写入基础设定文件", en: "writing foundation files" });
            await architect.writeFoundationFiles(stagingBookDir, foundation, gp.numericalSystem, book.language ?? gp.language);
            this.logStage(stageLanguage, { zh: "初始化控制文档", en: "initializing control documents" });
            await this.state.ensureControlDocumentsAt(stagingBookDir, book.language ?? gp.language, options.authorIntent ?? this.config.externalContext);
            if (options.currentFocus?.trim()) {
                await writeFile(join(stagingBookDir, "story", "current_focus.md"), options.currentFocus.trimEnd() + "\n", "utf-8");
            }
            await this.state.saveChapterIndexAt(stagingBookDir, []);
            this.logStage(stageLanguage, { zh: "创建初始快照", en: "creating initial snapshot" });
            await this.state.snapshotStateAt(stagingBookDir, 0);
            if (await this.pathExists(bookDir)) {
                if (await this.state.isCompleteBookDirectory(bookDir)) {
                    throw new Error(`Book "${book.id}" already exists at books/${book.id}/. Use a different title or delete the existing book first.`);
                }
                await rm(bookDir, { recursive: true, force: true });
            }
            await rename(stagingBookDir, bookDir);
        }
        catch (error) {
            await rm(stagingBookDir, { recursive: true, force: true }).catch(() => undefined);
            throw error;
        }
    }
    /** Import external source material and generate fanfic_canon.md */
    async importFanficCanon(bookId, sourceText, sourceName, fanficMode) {
        const { FanficCanonImporter } = await import("../agents/fanfic-canon-importer.js");
        const importer = new FanficCanonImporter(this.agentCtxFor("fanfic-canon-importer", bookId));
        const result = await importer.importFromText(sourceText, sourceName, fanficMode);
        const bookDir = this.state.bookDir(bookId);
        const storyDir = join(bookDir, "story");
        await mkdir(storyDir, { recursive: true });
        await writeFile(join(storyDir, "fanfic_canon.md"), result.fullDocument, "utf-8");
        return result.fullDocument;
    }
    /** One-step fanfic book creation: create book + import canon + generate foundation */
    async initFanficBook(book, sourceText, sourceName, fanficMode) {
        const bookDir = this.state.bookDir(book.id);
        const stageLanguage = await this.resolveBookLanguage(book);
        this.logStage(stageLanguage, { zh: "保存书籍配置", en: "saving book config" });
        await this.state.saveBookConfig(book.id, book);
        // Step 1: Import source material → fanfic_canon.md
        this.logStage(stageLanguage, { zh: "导入同人正典", en: "importing fanfic canon" });
        const fanficCanon = await this.importFanficCanon(book.id, sourceText, sourceName, fanficMode);
        // Step 2: Generate foundation with review loop
        const architect = new ArchitectAgent(this.agentCtxFor("architect", book.id));
        const reviewer = new FoundationReviewerAgent(this.agentCtxFor("foundation-reviewer", book.id));
        this.logStage(stageLanguage, { zh: "生成同人基础设定", en: "generating fanfic foundation" });
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const resolvedLanguage = (book.language ?? gp.language) === "en" ? "en" : "zh";
        const foundation = await this.generateAndReviewFoundation({
            generate: (reviewFeedback) => architect.generateFanficFoundation(book, fanficCanon, fanficMode, reviewFeedback),
            reviewer,
            mode: "fanfic",
            sourceCanon: fanficCanon,
            language: resolvedLanguage,
            stageLanguage,
        });
        this.logStage(stageLanguage, { zh: "写入基础设定文件", en: "writing foundation files" });
        await architect.writeFoundationFiles(bookDir, foundation, gp.numericalSystem, book.language ?? gp.language);
        this.logStage(stageLanguage, { zh: "初始化控制文档", en: "initializing control documents" });
        await this.state.ensureControlDocuments(book.id, this.config.externalContext);
        // Step 3: Generate style guide from source material
        if (sourceText.length >= 500) {
            this.logStage(stageLanguage, { zh: "提取原作风格指纹", en: "extracting source style fingerprint" });
            await this.tryGenerateStyleGuide(book.id, sourceText, sourceName, stageLanguage);
        }
        // Step 4: Initialize chapters directory + snapshot
        this.logStage(stageLanguage, { zh: "创建初始快照", en: "creating initial snapshot" });
        await mkdir(join(bookDir, "chapters"), { recursive: true });
        await this.state.saveChapterIndex(book.id, []);
        await this.state.snapshotState(book.id, 0);
    }
    /** Write a single draft chapter. Saves chapter file + truth files + index + snapshot. */
    async writeDraft(bookId, context, wordCount) {
        const releaseLock = await this.state.acquireBookLock(bookId);
        try {
            await this.state.ensureControlDocuments(bookId);
            const book = await this.state.loadBookConfig(bookId);
            const bookDir = this.state.bookDir(bookId);
            const chapterNumber = await this.state.getNextChapterNumber(bookId);
            const stageLanguage = await this.resolveBookLanguage(book);
            this.logStage(stageLanguage, { zh: "准备章节输入", en: "preparing chapter inputs" });
            const writeInput = await this.prepareWriteInput(book, bookDir, chapterNumber, context ?? this.config.externalContext);
            const { profile: gp } = await this.loadGenreProfile(book.genre);
            const lengthSpec = buildLengthSpec(wordCount ?? book.chapterWordCount, book.language ?? gp.language);
            const writer = new WriterAgent(this.agentCtxFor("writer", bookId));
            this.logStage(stageLanguage, { zh: "撰写章节草稿", en: "writing chapter draft" });
            const output = await writer.writeChapter({
                book,
                bookDir,
                chapterNumber,
                ...writeInput,
                lengthSpec,
                ...(wordCount ? { wordCountOverride: wordCount } : {}),
            });
            const writerCount = countChapterLength(output.content, lengthSpec.countingMode);
            let totalUsage = output.tokenUsage ?? {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            };
            const normalizedDraft = await this.normalizeDraftLengthIfNeeded({
                bookId,
                chapterNumber,
                chapterContent: output.content,
                lengthSpec,
                chapterIntent: writeInput.chapterIntent,
            });
            totalUsage = PipelineRunner.addUsage(totalUsage, normalizedDraft.tokenUsage);
            const draftOutput = {
                ...output,
                content: normalizedDraft.content,
                wordCount: normalizedDraft.wordCount,
                tokenUsage: totalUsage,
            };
            const lengthWarnings = this.buildLengthWarnings(chapterNumber, draftOutput.wordCount, lengthSpec);
            const lengthTelemetry = this.buildLengthTelemetry({
                lengthSpec,
                writerCount,
                postWriterNormalizeCount: normalizedDraft.wordCount,
                postReviseCount: 0,
                finalCount: draftOutput.wordCount,
                normalizeApplied: normalizedDraft.applied,
                lengthWarning: lengthWarnings.length > 0,
            });
            this.logLengthWarnings(lengthWarnings);
            // Save chapter file
            const chaptersDir = join(bookDir, "chapters");
            const paddedNum = String(chapterNumber).padStart(4, "0");
            const sanitized = draftOutput.title.replace(/[/\\?%*:|"<>]/g, "").replace(/\s+/g, "_").slice(0, 50);
            const filename = `${paddedNum}_${sanitized}.md`;
            const filePath = join(chaptersDir, filename);
            const resolvedLang = book.language ?? gp.language;
            const heading = resolvedLang === "en"
                ? `# Chapter ${chapterNumber}: ${draftOutput.title}`
                : `# 第${chapterNumber}章 ${draftOutput.title}`;
            await writeFile(filePath, `${heading}\n\n${draftOutput.content}`, "utf-8");
            // Save truth files
            this.logStage(stageLanguage, { zh: "落盘草稿与真相文件", en: "persisting draft and truth files" });
            await writer.saveChapter(bookDir, draftOutput, gp.numericalSystem, resolvedLang);
            await writer.saveNewTruthFiles(bookDir, draftOutput, resolvedLang);
            await this.syncLegacyStructuredStateFromMarkdown(bookDir, chapterNumber, draftOutput);
            await this.syncNarrativeMemoryIndex(bookId);
            // Update index
            const existingIndex = await this.state.loadChapterIndex(bookId);
            const now = new Date().toISOString();
            const newEntry = {
                number: chapterNumber,
                title: draftOutput.title,
                status: "drafted",
                wordCount: draftOutput.wordCount,
                createdAt: now,
                updatedAt: now,
                auditIssues: [],
                lengthWarnings,
                lengthTelemetry,
                ...(draftOutput.tokenUsage ? { tokenUsage: draftOutput.tokenUsage } : {}),
            };
            await this.state.saveChapterIndex(bookId, [...existingIndex, newEntry]);
            await this.markBookActiveIfNeeded(bookId);
            // Snapshot
            this.logStage(stageLanguage, { zh: "更新章节索引与快照", en: "updating chapter index and snapshots" });
            await this.state.snapshotState(bookId, chapterNumber);
            await this.syncCurrentStateFactHistory(bookId, chapterNumber);
            await this.emitWebhook("chapter-complete", bookId, chapterNumber, {
                title: draftOutput.title,
                wordCount: draftOutput.wordCount,
            });
            return {
                chapterNumber,
                title: draftOutput.title,
                wordCount: draftOutput.wordCount,
                filePath,
                lengthWarnings,
                lengthTelemetry,
                tokenUsage: draftOutput.tokenUsage,
            };
        }
        finally {
            await releaseLock();
        }
    }
    async planChapter(bookId, context) {
        await this.state.ensureControlDocuments(bookId);
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        const chapterNumber = await this.state.getNextChapterNumber(bookId);
        const stageLanguage = await this.resolveBookLanguage(book);
        this.logStage(stageLanguage, { zh: "规划下一章意图", en: "planning next chapter intent" });
        const { plan } = await this.createGovernedArtifacts(book, bookDir, chapterNumber, context ?? this.config.externalContext, { reuseExistingIntentWhenContextMissing: false });
        return {
            bookId,
            chapterNumber,
            intentPath: relativeToBookDir(bookDir, plan.runtimePath),
            goal: plan.intent.goal,
            conflicts: plan.intent.conflicts.map((conflict) => `${conflict.type}: ${conflict.resolution}`),
        };
    }
    async composeChapter(bookId, context) {
        await this.state.ensureControlDocuments(bookId);
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        const chapterNumber = await this.state.getNextChapterNumber(bookId);
        const stageLanguage = await this.resolveBookLanguage(book);
        this.logStage(stageLanguage, { zh: "组装章节运行时上下文", en: "composing chapter runtime context" });
        const { plan, composed } = await this.createGovernedArtifacts(book, bookDir, chapterNumber, context ?? this.config.externalContext, { reuseExistingIntentWhenContextMissing: true });
        return {
            bookId,
            chapterNumber,
            intentPath: relativeToBookDir(bookDir, plan.runtimePath),
            goal: plan.intent.goal,
            conflicts: plan.intent.conflicts.map((conflict) => `${conflict.type}: ${conflict.resolution}`),
            contextPath: relativeToBookDir(bookDir, composed.contextPath),
            ruleStackPath: relativeToBookDir(bookDir, composed.ruleStackPath),
            tracePath: relativeToBookDir(bookDir, composed.tracePath),
        };
    }
    /** Audit the latest (or specified) chapter. Read-only, no lock needed. */
    async auditDraft(bookId, chapterNumber) {
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        const targetChapter = chapterNumber ?? (await this.state.getNextChapterNumber(bookId)) - 1;
        if (targetChapter < 1) {
            throw new Error(`No chapters to audit for "${bookId}"`);
        }
        const content = await this.readChapterContent(bookDir, targetChapter);
        const auditor = new ContinuityAuditor(this.agentCtxFor("auditor", bookId));
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const language = book.language ?? gp.language;
        this.logStage(language, {
            zh: `审计第${targetChapter}章`,
            en: `auditing chapter ${targetChapter}`,
        });
        const evaluation = await this.evaluateMergedAudit({
            auditor,
            book,
            bookDir,
            chapterContent: content,
            chapterNumber: targetChapter,
            language,
        });
        const result = evaluation.auditResult;
        // Update index with audit result
        const index = await this.state.loadChapterIndex(bookId);
        const updated = index.map((ch) => ch.number === targetChapter
            ? {
                ...ch,
                status: (result.passed ? "ready-for-review" : "audit-failed"),
                updatedAt: new Date().toISOString(),
                auditIssues: result.issues.map((i) => `[${i.severity}] ${i.description}`),
            }
            : ch);
        await this.state.saveChapterIndex(bookId, updated);
        const latestChapter = index.length > 0 ? Math.max(...index.map((chapter) => chapter.number)) : targetChapter;
        if (targetChapter === latestChapter) {
            await this.persistAuditDriftGuidance({
                bookDir,
                chapterNumber: targetChapter,
                issues: result.issues.filter((issue) => issue.severity === "critical" || issue.severity === "warning"),
                language,
            }).catch(() => undefined);
        }
        await this.emitWebhook(result.passed ? "audit-passed" : "audit-failed", bookId, targetChapter, { summary: result.summary, issueCount: result.issues.length });
        return { ...result, chapterNumber: targetChapter };
    }
    /** Revise the latest (or specified) chapter based on audit issues. */
    async reviseDraft(bookId, chapterNumber, mode = DEFAULT_REVISE_MODE) {
        const releaseLock = await this.state.acquireBookLock(bookId);
        try {
            const book = await this.state.loadBookConfig(bookId);
            const bookDir = this.state.bookDir(bookId);
            const targetChapter = chapterNumber ?? (await this.state.getNextChapterNumber(bookId)) - 1;
            if (targetChapter < 1) {
                throw new Error(`No chapters to revise for "${bookId}"`);
            }
            const stageLanguage = await this.resolveBookLanguage(book);
            // Read the current audit issues from index
            this.logStage(stageLanguage, {
                zh: `加载第${targetChapter}章修订上下文`,
                en: `loading revision context for chapter ${targetChapter}`,
            });
            const index = await this.state.loadChapterIndex(bookId);
            const chapterMeta = index.find((ch) => ch.number === targetChapter);
            if (!chapterMeta) {
                throw new Error(`Chapter ${targetChapter} not found in index`);
            }
            // Re-audit to get structured issues (index only stores strings)
            const content = await this.readChapterContent(bookDir, targetChapter);
            const auditor = new ContinuityAuditor(this.agentCtxFor("auditor", bookId));
            const { profile: gp } = await this.loadGenreProfile(book.genre);
            const language = book.language ?? gp.language;
            const countingMode = resolveLengthCountingMode(language);
            const reviseControlInput = (this.config.inputGovernanceMode ?? "v2") === "legacy"
                ? undefined
                : await this.createGovernedArtifacts(book, bookDir, targetChapter, this.config.externalContext, { reuseExistingIntentWhenContextMissing: true });
            const preRevision = await this.evaluateMergedAudit({
                auditor,
                book,
                bookDir,
                chapterContent: content,
                chapterNumber: targetChapter,
                language,
                auditOptions: reviseControlInput
                    ? {
                        chapterIntent: reviseControlInput.plan.intentMarkdown,
                        contextPackage: reviseControlInput.composed.contextPackage,
                        ruleStack: reviseControlInput.composed.ruleStack,
                    }
                    : undefined,
            });
            if (preRevision.blockingCount === 0 && preRevision.aiTellCount === 0) {
                return {
                    chapterNumber: targetChapter,
                    wordCount: countChapterLength(content, countingMode),
                    fixedIssues: [],
                    applied: false,
                    status: "unchanged",
                    skippedReason: "No warning, critical, or AI-tell issues to fix.",
                };
            }
            const chapterLengthTarget = chapterMeta.lengthTelemetry?.target ?? book.chapterWordCount;
            const lengthLanguage = chapterMeta.lengthTelemetry?.countingMode === "en_words"
                ? "en"
                : language;
            const lengthSpec = buildLengthSpec(chapterLengthTarget, lengthLanguage);
            const reviser = new ReviserAgent(this.agentCtxFor("reviser", bookId));
            this.logStage(stageLanguage, {
                zh: `修订第${targetChapter}章`,
                en: `revising chapter ${targetChapter}`,
            });
            const reviseOutput = await reviser.reviseChapter(bookDir, content, targetChapter, preRevision.auditResult.issues, mode, book.genre, reviseControlInput
                ? {
                    chapterIntent: reviseControlInput.plan.intentMarkdown,
                    contextPackage: reviseControlInput.composed.contextPackage,
                    ruleStack: reviseControlInput.composed.ruleStack,
                    lengthSpec,
                }
                : { lengthSpec });
            if (reviseOutput.revisedContent.length === 0) {
                throw new Error("Reviser returned empty content");
            }
            const normalizedRevision = await this.normalizeDraftLengthIfNeeded({
                bookId,
                chapterNumber: targetChapter,
                chapterContent: reviseOutput.revisedContent,
                lengthSpec,
            });
            const postRevision = await this.evaluateMergedAudit({
                auditor,
                book,
                bookDir,
                chapterContent: normalizedRevision.content,
                chapterNumber: targetChapter,
                language,
                auditOptions: reviseControlInput
                    ? {
                        temperature: 0,
                        chapterIntent: reviseControlInput.plan.intentMarkdown,
                        contextPackage: reviseControlInput.composed.contextPackage,
                        ruleStack: reviseControlInput.composed.ruleStack,
                        truthFileOverrides: {
                            currentState: reviseOutput.updatedState !== "(状态卡未更新)" ? reviseOutput.updatedState : undefined,
                            ledger: reviseOutput.updatedLedger !== "(账本未更新)" ? reviseOutput.updatedLedger : undefined,
                            hooks: reviseOutput.updatedHooks !== "(伏笔池未更新)" ? reviseOutput.updatedHooks : undefined,
                        },
                    }
                    : {
                        temperature: 0,
                        truthFileOverrides: {
                            currentState: reviseOutput.updatedState !== "(状态卡未更新)" ? reviseOutput.updatedState : undefined,
                            ledger: reviseOutput.updatedLedger !== "(账本未更新)" ? reviseOutput.updatedLedger : undefined,
                            hooks: reviseOutput.updatedHooks !== "(伏笔池未更新)" ? reviseOutput.updatedHooks : undefined,
                        },
                    },
            });
            const effectivePostRevision = this.restoreActionableAuditIfLost(preRevision, postRevision);
            const revisionBaseCount = countChapterLength(content, lengthSpec.countingMode);
            const lengthWarnings = this.buildLengthWarnings(targetChapter, normalizedRevision.wordCount, lengthSpec);
            const lengthTelemetry = this.buildLengthTelemetry({
                lengthSpec,
                writerCount: revisionBaseCount,
                postWriterNormalizeCount: 0,
                postReviseCount: normalizedRevision.wordCount,
                finalCount: normalizedRevision.wordCount,
                normalizeApplied: normalizedRevision.applied,
                lengthWarning: lengthWarnings.length > 0,
            });
            const improvedBlocking = effectivePostRevision.blockingCount < preRevision.blockingCount;
            const improvedAITells = effectivePostRevision.aiTellCount < preRevision.aiTellCount;
            const blockingDidNotWorsen = effectivePostRevision.blockingCount <= preRevision.blockingCount;
            const criticalDidNotWorsen = effectivePostRevision.criticalCount <= preRevision.criticalCount;
            const aiDidNotWorsen = effectivePostRevision.aiTellCount <= preRevision.aiTellCount;
            const shouldApplyRevision = blockingDidNotWorsen
                && criticalDidNotWorsen
                && aiDidNotWorsen
                && (improvedBlocking || improvedAITells);
            if (!shouldApplyRevision) {
                return {
                    chapterNumber: targetChapter,
                    wordCount: revisionBaseCount,
                    fixedIssues: [],
                    applied: false,
                    status: "unchanged",
                    skippedReason: "Manual revision did not improve merged audit or AI-tell metrics; kept original chapter.",
                };
            }
            this.logLengthWarnings(lengthWarnings);
            // Save revised chapter file
            this.logStage(stageLanguage, {
                zh: `落盘第${targetChapter}章修订结果`,
                en: `persisting revision for chapter ${targetChapter}`,
            });
            const chaptersDir = join(bookDir, "chapters");
            const files = await readdir(chaptersDir);
            const paddedNum = String(targetChapter).padStart(4, "0");
            const existingFile = files.find((f) => f.startsWith(paddedNum) && f.endsWith(".md"));
            if (!existingFile) {
                throw new Error(`Chapter ${targetChapter} file not found in ${chaptersDir} (expected filename starting with ${paddedNum})`);
            }
            const reviseLang = book.language ?? gp.language;
            const reviseHeading = reviseLang === "en"
                ? `# Chapter ${targetChapter}: ${chapterMeta.title}`
                : `# 第${targetChapter}章 ${chapterMeta.title}`;
            await writeFile(join(chaptersDir, existingFile), `${reviseHeading}\n\n${normalizedRevision.content}`, "utf-8");
            // Update truth files
            const storyDir = join(bookDir, "story");
            if (reviseOutput.updatedState !== "(状态卡未更新)") {
                await writeFile(join(storyDir, "current_state.md"), reviseOutput.updatedState, "utf-8");
            }
            if (gp.numericalSystem && reviseOutput.updatedLedger && reviseOutput.updatedLedger !== "(账本未更新)") {
                await writeFile(join(storyDir, "particle_ledger.md"), reviseOutput.updatedLedger, "utf-8");
            }
            if (reviseOutput.updatedHooks !== "(伏笔池未更新)") {
                await writeFile(join(storyDir, "pending_hooks.md"), reviseOutput.updatedHooks, "utf-8");
            }
            await this.syncLegacyStructuredStateFromMarkdown(bookDir, targetChapter);
            // Update index
            const updatedIndex = index.map((ch) => ch.number === targetChapter
                ? {
                    ...ch,
                    status: (effectivePostRevision.auditResult.passed ? "ready-for-review" : "audit-failed"),
                    wordCount: normalizedRevision.wordCount,
                    updatedAt: new Date().toISOString(),
                    auditIssues: effectivePostRevision.auditResult.issues.map((i) => `[${i.severity}] ${i.description}`),
                    lengthWarnings,
                    lengthTelemetry,
                }
                : ch);
            await this.state.saveChapterIndex(bookId, updatedIndex);
            const latestChapter = index.length > 0 ? Math.max(...index.map((chapter) => chapter.number)) : targetChapter;
            if (targetChapter === latestChapter) {
                await this.persistAuditDriftGuidance({
                    bookDir,
                    chapterNumber: targetChapter,
                    issues: effectivePostRevision.auditResult.issues.filter((issue) => issue.severity === "critical" || issue.severity === "warning"),
                    language,
                }).catch(() => undefined);
            }
            // Re-snapshot
            this.logStage(stageLanguage, {
                zh: `更新第${targetChapter}章索引与快照`,
                en: `updating chapter index and snapshots for chapter ${targetChapter}`,
            });
            await this.state.snapshotState(bookId, targetChapter);
            await this.syncNarrativeMemoryIndex(bookId);
            await this.syncCurrentStateFactHistory(bookId, targetChapter);
            await this.emitWebhook("revision-complete", bookId, targetChapter, {
                wordCount: normalizedRevision.wordCount,
                fixedCount: reviseOutput.fixedIssues.length,
            });
            return {
                chapterNumber: targetChapter,
                wordCount: normalizedRevision.wordCount,
                fixedIssues: reviseOutput.fixedIssues,
                applied: true,
                status: effectivePostRevision.auditResult.passed ? "ready-for-review" : "audit-failed",
                lengthWarnings,
                lengthTelemetry,
            };
        }
        finally {
            await releaseLock();
        }
    }
    /** Read all truth files for a book. */
    async readTruthFiles(bookId) {
        const bookDir = this.state.bookDir(bookId);
        const storyDir = join(bookDir, "story");
        const readSafe = async (path) => {
            try {
                return await readFile(path, "utf-8");
            }
            catch {
                return "(文件不存在)";
            }
        };
        const [currentState, particleLedger, pendingHooks, storyBible, volumeOutline, bookRules] = await Promise.all([
            readSafe(join(storyDir, "current_state.md")),
            readSafe(join(storyDir, "particle_ledger.md")),
            readSafe(join(storyDir, "pending_hooks.md")),
            readSafe(join(storyDir, "story_bible.md")),
            readSafe(join(storyDir, "volume_outline.md")),
            readSafe(join(storyDir, "book_rules.md")),
        ]);
        return { currentState, particleLedger, pendingHooks, storyBible, volumeOutline, bookRules };
    }
    /** Get book status overview. */
    async getBookStatus(bookId) {
        const book = await this.state.loadBookConfig(bookId);
        const chapters = await this.state.loadChapterIndex(bookId);
        const nextChapter = await this.state.getNextChapterNumber(bookId);
        const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
        return {
            bookId,
            title: book.title,
            genre: book.genre,
            platform: book.platform,
            status: book.status,
            chaptersWritten: chapters.length,
            totalWords,
            nextChapter,
            chapters: [...chapters],
        };
    }
    // ---------------------------------------------------------------------------
    // Full pipeline (convenience — runs draft + audit + revise in one shot)
    // ---------------------------------------------------------------------------
    async writeNextChapter(bookId, wordCount, temperatureOverride) {
        const releaseLock = await this.state.acquireBookLock(bookId);
        try {
            return await this._writeNextChapterLocked(bookId, wordCount, temperatureOverride);
        }
        finally {
            await releaseLock();
        }
    }
    async repairChapterState(bookId, chapterNumber) {
        const releaseLock = await this.state.acquireBookLock(bookId);
        try {
            return await this._repairChapterStateLocked(bookId, chapterNumber);
        }
        finally {
            await releaseLock();
        }
    }
    async resyncChapterArtifacts(bookId, chapterNumber) {
        const releaseLock = await this.state.acquireBookLock(bookId);
        try {
            return await this._resyncChapterArtifactsLocked(bookId, chapterNumber);
        }
        finally {
            await releaseLock();
        }
    }
    async _writeNextChapterLocked(bookId, wordCount, temperatureOverride) {
        await this.state.ensureControlDocuments(bookId);
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        await this.assertNoPendingStateRepair(bookId);
        const chapterNumber = await this.state.getNextChapterNumber(bookId);
        const stageLanguage = await this.resolveBookLanguage(book);
        this.logStage(stageLanguage, { zh: "准备章节输入", en: "preparing chapter inputs" });
        const writeInput = await this.prepareWriteInput(book, bookDir, chapterNumber, this.config.externalContext);
        const reducedControlInput = writeInput.chapterIntent && writeInput.contextPackage && writeInput.ruleStack
            ? {
                chapterIntent: writeInput.chapterIntent,
                contextPackage: writeInput.contextPackage,
                ruleStack: writeInput.ruleStack,
            }
            : undefined;
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const pipelineLang = book.language ?? gp.language;
        const lengthSpec = buildLengthSpec(wordCount ?? book.chapterWordCount, pipelineLang);
        // 1. Write chapter
        const writer = new WriterAgent(this.agentCtxFor("writer", bookId));
        this.logStage(stageLanguage, { zh: "撰写章节草稿", en: "writing chapter draft" });
        const output = await writer.writeChapter({
            book,
            bookDir,
            chapterNumber,
            ...writeInput,
            lengthSpec,
            ...(wordCount ? { wordCountOverride: wordCount } : {}),
            ...(temperatureOverride ? { temperatureOverride } : {}),
        });
        const writerCount = countChapterLength(output.content, lengthSpec.countingMode);
        // Token usage accumulator
        let totalUsage = output.tokenUsage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        const auditor = new ContinuityAuditor(this.agentCtxFor("auditor", bookId));
        const reviewResult = await runChapterReviewCycle({
            book: { genre: book.genre },
            bookDir,
            chapterNumber,
            initialOutput: output,
            reducedControlInput,
            lengthSpec,
            initialUsage: totalUsage,
            createReviser: () => new ReviserAgent(this.agentCtxFor("reviser", bookId)),
            auditor,
            normalizeDraftLengthIfNeeded: (chapterContent) => this.normalizeDraftLengthIfNeeded({
                bookId,
                chapterNumber,
                chapterContent,
                lengthSpec,
                chapterIntent: writeInput.chapterIntent,
            }),
            assertChapterContentNotEmpty: (content, stage) => this.assertChapterContentNotEmpty(content, chapterNumber, stage),
            addUsage: PipelineRunner.addUsage,
            restoreLostAuditIssues: (previous, next) => this.restoreLostAuditIssues(previous, next),
            analyzeAITells,
            analyzeSensitiveWords,
            logWarn: (message) => this.logWarn(pipelineLang, message),
            logStage: (message) => this.logStage(stageLanguage, message),
        });
        totalUsage = reviewResult.totalUsage;
        let finalContent = reviewResult.finalContent;
        let finalWordCount = reviewResult.finalWordCount;
        let revised = reviewResult.revised;
        let auditResult = reviewResult.auditResult;
        const postReviseCount = reviewResult.postReviseCount;
        const normalizeApplied = reviewResult.normalizeApplied;
        // 4. Save the final chapter and truth files from a single persistence source
        this.logStage(stageLanguage, { zh: "落盘最终章节", en: "persisting final chapter" });
        this.logStage(stageLanguage, { zh: "生成最终真相文件", en: "rebuilding final truth files" });
        const chapterIndexBeforePersist = await this.state.loadChapterIndex(bookId);
        const { resolveDuplicateTitle } = await import("../agents/post-write-validator.js");
        const initialTitleResolution = resolveDuplicateTitle(output.title, chapterIndexBeforePersist.map((chapter) => chapter.title), pipelineLang, { content: finalContent });
        let persistenceOutput = await this.buildPersistenceOutput(bookId, book, bookDir, chapterNumber, initialTitleResolution.title === output.title
            ? output
            : { ...output, title: initialTitleResolution.title }, finalContent, lengthSpec.countingMode, reducedControlInput);
        const finalTitleResolution = resolveDuplicateTitle(persistenceOutput.title, chapterIndexBeforePersist.map((chapter) => chapter.title), pipelineLang, { content: finalContent });
        if (finalTitleResolution.title !== persistenceOutput.title) {
            persistenceOutput = {
                ...persistenceOutput,
                title: finalTitleResolution.title,
            };
        }
        if (persistenceOutput.title !== output.title) {
            const description = pipelineLang === "en"
                ? `Chapter title "${output.title}" was auto-adjusted to "${persistenceOutput.title}".`
                : `章节标题"${output.title}"已自动调整为"${persistenceOutput.title}"。`;
            this.config.logger?.warn(`[title] ${description}`);
            auditResult = {
                ...auditResult,
                issues: [...auditResult.issues, {
                        severity: "warning",
                        category: "title-dedup",
                        description,
                        suggestion: pipelineLang === "en"
                            ? "If the auto-renamed title is weak, revise the chapter title manually."
                            : "如果自动改名不理想，可以在后续手动修订章节标题。",
                    }],
            };
        }
        const longSpanFatigue = await analyzeLongSpanFatigue({
            bookDir,
            chapterNumber,
            chapterContent: finalContent,
            chapterSummary: persistenceOutput.chapterSummary,
            language: pipelineLang,
        });
        auditResult = {
            ...auditResult,
            issues: [
                ...auditResult.issues,
                ...longSpanFatigue.issues,
                ...(persistenceOutput.hookHealthIssues ?? []),
            ],
        };
        finalWordCount = persistenceOutput.wordCount;
        const lengthWarnings = this.buildLengthWarnings(chapterNumber, finalWordCount, lengthSpec);
        const lengthTelemetry = this.buildLengthTelemetry({
            lengthSpec,
            writerCount,
            postWriterNormalizeCount: reviewResult.preAuditNormalizedWordCount,
            postReviseCount,
            finalCount: finalWordCount,
            normalizeApplied,
            lengthWarning: lengthWarnings.length > 0,
        });
        this.logLengthWarnings(lengthWarnings);
        // 4.1 Validate settler output before writing
        this.logStage(stageLanguage, { zh: "校验真相文件变更", en: "validating truth file updates" });
        const storyDir = join(bookDir, "story");
        const [oldState, oldHooks, oldLedger] = await Promise.all([
            readFile(join(storyDir, "current_state.md"), "utf-8").catch(() => ""),
            readFile(join(storyDir, "pending_hooks.md"), "utf-8").catch(() => ""),
            readFile(join(storyDir, "particle_ledger.md"), "utf-8").catch(() => ""),
        ]);
        const validator = new StateValidatorAgent(this.agentCtxFor("state-validator", bookId));
        const truthValidation = await validateChapterTruthPersistence({
            writer,
            validator,
            book,
            bookDir,
            chapterNumber,
            title: persistenceOutput.title,
            content: finalContent,
            persistenceOutput,
            auditResult,
            previousTruth: {
                oldState,
                oldHooks,
                oldLedger,
            },
            reducedControlInput,
            language: pipelineLang,
            logWarn: (message) => this.logWarn(pipelineLang, message),
            logger: this.config.logger,
        });
        let chapterStatus = truthValidation.chapterStatus;
        let degradedIssues = truthValidation.degradedIssues;
        persistenceOutput = truthValidation.persistenceOutput;
        auditResult = truthValidation.auditResult;
        // 4.2 Final paragraph shape check on persisted content (post-normalize, post-revise)
        {
            const { detectParagraphLengthDrift, detectParagraphShapeWarnings, } = await import("../agents/post-write-validator.js");
            const chapDir = join(bookDir, "chapters");
            const recentFiles = (await readdir(chapDir).catch(() => []))
                .filter((f) => f.endsWith(".md") && /^\d{4}/.test(f))
                .sort()
                .slice(-5);
            const recentContent = (await Promise.all(recentFiles.map((f) => readFile(join(chapDir, f), "utf-8").catch(() => "")))).join("\n\n");
            const paragraphIssues = [
                ...detectParagraphShapeWarnings(finalContent, pipelineLang),
                ...detectParagraphLengthDrift(finalContent, recentContent, pipelineLang),
            ];
            if (paragraphIssues.length > 0) {
                for (const issue of paragraphIssues) {
                    this.config.logger?.warn(`[paragraph] ${issue.description}`);
                }
                auditResult = {
                    ...auditResult,
                    issues: [...auditResult.issues, ...paragraphIssues.map((v) => ({
                            severity: v.severity,
                            category: "paragraph-shape",
                            description: v.description,
                            suggestion: v.suggestion,
                        }))],
                };
            }
        }
        const resolvedStatus = chapterStatus ?? (auditResult.passed ? "ready-for-review" : "audit-failed");
        await persistChapterArtifacts({
            chapterNumber,
            chapterTitle: persistenceOutput.title,
            status: resolvedStatus,
            auditResult,
            finalWordCount,
            lengthWarnings,
            lengthTelemetry,
            degradedIssues,
            tokenUsage: totalUsage,
            loadChapterIndex: () => this.state.loadChapterIndex(bookId),
            saveChapter: () => writer.saveChapter(bookDir, persistenceOutput, gp.numericalSystem, pipelineLang),
            saveTruthFiles: async () => {
                await writer.saveNewTruthFiles(bookDir, persistenceOutput, pipelineLang);
                await this.syncLegacyStructuredStateFromMarkdown(bookDir, chapterNumber, persistenceOutput);
                this.logStage(stageLanguage, { zh: "同步记忆索引", en: "syncing memory indexes" });
                await this.syncNarrativeMemoryIndex(bookId);
            },
            saveChapterIndex: (index) => this.state.saveChapterIndex(bookId, index),
            markBookActiveIfNeeded: () => this.markBookActiveIfNeeded(bookId),
            persistAuditDriftGuidance: (issues) => this.persistAuditDriftGuidance({
                bookDir,
                chapterNumber,
                issues,
                language: stageLanguage,
            }).catch(() => undefined),
            snapshotState: () => this.state.snapshotState(bookId, chapterNumber),
            syncCurrentStateFactHistory: () => this.syncCurrentStateFactHistory(bookId, chapterNumber),
            logSnapshotStage: () => this.logStage(stageLanguage, { zh: "更新章节索引与快照", en: "updating chapter index and snapshots" }),
        });
        // 6. Send notification
        if (this.config.notifyChannels && this.config.notifyChannels.length > 0) {
            const statusEmoji = resolvedStatus === "state-degraded"
                ? "🧯"
                : auditResult.passed ? "✅" : "⚠️";
            const chapterLength = formatLengthCount(finalWordCount, lengthSpec.countingMode);
            await dispatchNotification(this.config.notifyChannels, {
                title: `${statusEmoji} ${book.title} 第${chapterNumber}章`,
                body: [
                    `**${persistenceOutput.title}** | ${chapterLength}`,
                    revised ? "📝 已自动修正" : "",
                    resolvedStatus === "state-degraded"
                        ? "状态结算: 已降级保存，需先修复 state 再继续"
                        : `审稿: ${auditResult.passed ? "通过" : "需人工审核"}`,
                    ...auditResult.issues
                        .filter((i) => i.severity !== "info")
                        .map((i) => `- [${i.severity}] ${i.description}`),
                ]
                    .filter(Boolean)
                    .join("\n"),
            });
        }
        await this.emitWebhook("pipeline-complete", bookId, chapterNumber, {
            title: persistenceOutput.title,
            wordCount: finalWordCount,
            passed: auditResult.passed,
            revised,
            status: resolvedStatus,
        });
        return {
            chapterNumber,
            title: persistenceOutput.title,
            wordCount: finalWordCount,
            auditResult,
            revised,
            status: resolvedStatus,
            lengthWarnings,
            lengthTelemetry,
            tokenUsage: totalUsage,
        };
    }
    async _repairChapterStateLocked(bookId, chapterNumber) {
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        const stageLanguage = await this.resolveBookLanguage(book);
        const index = [...(await this.state.loadChapterIndex(bookId))];
        if (index.length === 0) {
            throw new Error(`Book "${bookId}" has no persisted chapters to repair.`);
        }
        const targetChapter = chapterNumber ?? index[index.length - 1].number;
        const targetIndex = index.findIndex((chapter) => chapter.number === targetChapter);
        if (targetIndex < 0) {
            throw new Error(`Chapter ${targetChapter} not found in "${bookId}".`);
        }
        const targetMeta = index[targetIndex];
        const latestChapter = Math.max(...index.map((chapter) => chapter.number));
        if (targetMeta.status !== "state-degraded") {
            throw new Error(`Chapter ${targetChapter} is not state-degraded.`);
        }
        if (targetChapter !== latestChapter) {
            throw new Error(`Only the latest state-degraded chapter can be repaired safely (latest is ${latestChapter}).`);
        }
        this.logStage(stageLanguage, { zh: "修复章节状态结算", en: "repairing chapter state settlement" });
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const pipelineLang = book.language ?? gp.language;
        const content = await this.readChapterContent(bookDir, targetChapter);
        const storyDir = join(bookDir, "story");
        const [oldState, oldHooks] = await Promise.all([
            readFile(join(storyDir, "current_state.md"), "utf-8").catch(() => ""),
            readFile(join(storyDir, "pending_hooks.md"), "utf-8").catch(() => ""),
        ]);
        const writer = new WriterAgent(this.agentCtxFor("writer", bookId));
        let repairedOutput = await writer.settleChapterState({
            book,
            bookDir,
            chapterNumber: targetChapter,
            title: targetMeta.title,
            content,
            allowReapply: true,
        });
        const validator = new StateValidatorAgent(this.agentCtxFor("state-validator", bookId));
        let validation = await validator.validate(content, targetChapter, oldState, repairedOutput.updatedState, oldHooks, repairedOutput.updatedHooks, pipelineLang);
        if (!validation.passed) {
            const recovery = await retrySettlementAfterValidationFailure({
                writer,
                validator,
                book,
                bookDir,
                chapterNumber: targetChapter,
                title: targetMeta.title,
                content,
                oldState,
                oldHooks,
                originalValidation: validation,
                language: pipelineLang,
                logWarn: (message) => this.logWarn(pipelineLang, message),
                logger: this.config.logger,
            });
            if (recovery.kind !== "recovered") {
                throw new Error(recovery.issues[0]?.description
                    ?? `State repair still failed for chapter ${targetChapter}.`);
            }
            repairedOutput = recovery.output;
            validation = recovery.validation;
        }
        if (!validation.passed) {
            throw new Error(`State repair still failed for chapter ${targetChapter}.`);
        }
        await writer.saveChapter(bookDir, repairedOutput, gp.numericalSystem, pipelineLang);
        await writer.saveNewTruthFiles(bookDir, repairedOutput, pipelineLang);
        await this.syncLegacyStructuredStateFromMarkdown(bookDir, targetChapter, repairedOutput);
        await this.syncNarrativeMemoryIndex(bookId);
        await this.state.snapshotState(bookId, targetChapter);
        await this.syncCurrentStateFactHistory(bookId, targetChapter);
        const baseStatus = resolveStateDegradedBaseStatus(targetMeta);
        const degradedMetadata = parseStateDegradedReviewNote(targetMeta.reviewNote);
        const injectedIssues = new Set(degradedMetadata?.injectedIssues ?? []);
        index[targetIndex] = {
            ...targetMeta,
            status: baseStatus,
            updatedAt: new Date().toISOString(),
            auditIssues: targetMeta.auditIssues.filter((issue) => !injectedIssues.has(issue)),
            reviewNote: undefined,
        };
        await this.state.saveChapterIndex(bookId, index);
        const repairedPassesAudit = baseStatus !== "audit-failed";
        return {
            chapterNumber: targetChapter,
            title: targetMeta.title,
            wordCount: targetMeta.wordCount,
            auditResult: {
                passed: repairedPassesAudit,
                issues: [],
                summary: repairedPassesAudit ? "state repaired" : "state repaired but chapter still needs review",
            },
            revised: false,
            status: baseStatus,
            lengthWarnings: targetMeta.lengthWarnings,
            lengthTelemetry: targetMeta.lengthTelemetry,
            tokenUsage: targetMeta.tokenUsage,
        };
    }
    async _resyncChapterArtifactsLocked(bookId, chapterNumber) {
        const book = await this.state.loadBookConfig(bookId);
        const bookDir = this.state.bookDir(bookId);
        const stageLanguage = await this.resolveBookLanguage(book);
        const index = [...(await this.state.loadChapterIndex(bookId))];
        if (index.length === 0) {
            throw new Error(`Book "${bookId}" has no persisted chapters to sync.`);
        }
        const targetChapter = chapterNumber ?? index[index.length - 1].number;
        const targetIndex = index.findIndex((chapter) => chapter.number === targetChapter);
        if (targetIndex < 0) {
            throw new Error(`Chapter ${targetChapter} not found in "${bookId}".`);
        }
        const targetMeta = index[targetIndex];
        const latestChapter = Math.max(...index.map((chapter) => chapter.number));
        if (targetChapter !== latestChapter) {
            throw new Error(`Only the latest persisted chapter can be synced safely (latest is ${latestChapter}).`);
        }
        this.logStage(stageLanguage, { zh: "根据已编辑正文同步真相文件与索引", en: "syncing truth files and indexes from edited chapter body" });
        const { profile: gp } = await this.loadGenreProfile(book.genre);
        const pipelineLang = book.language ?? gp.language;
        const content = await this.readChapterContent(bookDir, targetChapter);
        const storyDir = join(bookDir, "story");
        const [oldState, oldHooks] = await Promise.all([
            readFile(join(storyDir, "current_state.md"), "utf-8").catch(() => ""),
            readFile(join(storyDir, "pending_hooks.md"), "utf-8").catch(() => ""),
        ]);
        const reducedControlInput = (this.config.inputGovernanceMode ?? "v2") === "legacy"
            ? undefined
            : await this.createGovernedArtifacts(book, bookDir, targetChapter, this.config.externalContext, { reuseExistingIntentWhenContextMissing: true });
        const writer = new WriterAgent(this.agentCtxFor("writer", bookId));
        let syncedOutput = await writer.settleChapterState({
            book,
            bookDir,
            chapterNumber: targetChapter,
            title: targetMeta.title,
            content,
            chapterIntent: reducedControlInput?.plan.intentMarkdown,
            contextPackage: reducedControlInput?.composed.contextPackage,
            ruleStack: reducedControlInput?.composed.ruleStack,
            allowReapply: true,
        });
        const validator = new StateValidatorAgent(this.agentCtxFor("state-validator", bookId));
        let validation = await validator.validate(content, targetChapter, oldState, syncedOutput.updatedState, oldHooks, syncedOutput.updatedHooks, pipelineLang);
        if (!validation.passed) {
            const recovery = await retrySettlementAfterValidationFailure({
                writer,
                validator,
                book,
                bookDir,
                chapterNumber: targetChapter,
                title: targetMeta.title,
                content,
                reducedControlInput: reducedControlInput
                    ? {
                        chapterIntent: reducedControlInput.plan.intentMarkdown,
                        contextPackage: reducedControlInput.composed.contextPackage,
                        ruleStack: reducedControlInput.composed.ruleStack,
                    }
                    : undefined,
                oldState,
                oldHooks,
                originalValidation: validation,
                language: pipelineLang,
                logWarn: (message) => this.logWarn(pipelineLang, message),
                logger: this.config.logger,
            });
            if (recovery.kind !== "recovered") {
                throw new Error(recovery.issues[0]?.description
                    ?? `Chapter sync still failed for chapter ${targetChapter}.`);
            }
            syncedOutput = recovery.output;
            validation = recovery.validation;
        }
        if (!validation.passed) {
            throw new Error(`Chapter sync still failed for chapter ${targetChapter}.`);
        }
        await writer.saveChapter(bookDir, syncedOutput, gp.numericalSystem, pipelineLang);
        await writer.saveNewTruthFiles(bookDir, syncedOutput, pipelineLang);
        await this.syncLegacyStructuredStateFromMarkdown(bookDir, targetChapter, syncedOutput);
        await this.syncNarrativeMemoryIndex(bookId);
        await this.state.snapshotState(bookId, targetChapter);
        await this.syncCurrentStateFactHistory(bookId, targetChapter);
        const finalStatus = targetMeta.status === "state-degraded"
            ? resolveStateDegradedBaseStatus(targetMeta)
            : "ready-for-review";
        if (targetMeta.status === "state-degraded") {
            const degradedMetadata = parseStateDegradedReviewNote(targetMeta.reviewNote);
            const injectedIssues = new Set(degradedMetadata?.injectedIssues ?? []);
            index[targetIndex] = {
                ...targetMeta,
                status: finalStatus,
                updatedAt: new Date().toISOString(),
                auditIssues: targetMeta.auditIssues.filter((issue) => !injectedIssues.has(issue)),
                reviewNote: undefined,
            };
        }
        else {
            index[targetIndex] = {
                ...targetMeta,
                status: "ready-for-review",
                updatedAt: new Date().toISOString(),
            };
        }
        await this.state.saveChapterIndex(bookId, index);
        return {
            chapterNumber: targetChapter,
            title: targetMeta.title,
            wordCount: targetMeta.wordCount,
            auditResult: {
                passed: finalStatus !== "audit-failed",
                issues: [],
                summary: finalStatus === "audit-failed"
                    ? "chapter truth/state resynced from edited body, but chapter still needs audit fixes"
                    : "chapter truth/state resynced from edited body",
            },
            revised: false,
            status: finalStatus,
            lengthWarnings: targetMeta.lengthWarnings,
            lengthTelemetry: targetMeta.lengthTelemetry,
            tokenUsage: targetMeta.tokenUsage,
        };
    }
    // ---------------------------------------------------------------------------
    // Import operations (style imitation + canon for spinoff)
    // ---------------------------------------------------------------------------
    /**
     * Generate a qualitative style guide from reference text via LLM.
     * Also saves the statistical style_profile.json.
     */
    async generateStyleGuide(bookId, referenceText, sourceName) {
        if (referenceText.length < 500) {
            throw new Error(`Reference text too short (${referenceText.length} chars, minimum 500). Provide at least 2000 chars for reliable style extraction.`);
        }
        const { analyzeStyle } = await import("../agents/style-analyzer.js");
        const bookDir = this.state.bookDir(bookId);
        const storyDir = join(bookDir, "story");
        await mkdir(storyDir, { recursive: true });
        // Statistical fingerprint
        const profile = analyzeStyle(referenceText, sourceName);
        await writeFile(join(storyDir, "style_profile.json"), JSON.stringify(profile, null, 2), "utf-8");
        // LLM qualitative extraction
        const response = await chatCompletion(this.config.client, this.config.model, [
            {
                role: "system",
                content: `你是一位文学风格分析专家。分析参考文本的写作风格，提取可供模仿的定性特征。

输出格式（Markdown）：
## 叙事声音与语气
（冷峻/热烈/讽刺/温情/...，附1-2个原文例句）

## 对话风格
（角色说话的共性特征：句子长短、口头禅倾向、方言痕迹、对话节奏）

## 场景描写特征
（五感偏好、意象选择、描写密度、环境与情绪的关联方式）

## 转折与衔接手法
（场景如何切换、时间跳跃的处理方式、段落间的过渡特征）

## 节奏特征
（长短句分布、段落长度偏好、高潮/舒缓的交替方式）

## 词汇偏好
（高频特色用词、比喻/修辞倾向、口语化程度）

## 情绪表达方式
（直白抒情 vs 动作外化、内心独白的频率和风格）

## 独特习惯
（任何值得模仿的个人写作习惯）

分析必须基于原文实际特征，不要泛泛而谈。每个部分用1-2个原文例句佐证。`,
            },
            {
                role: "user",
                content: `分析以下参考文本的写作风格：\n\n${referenceText.slice(0, 20000)}`,
            },
        ], { temperature: 0.3, maxTokens: 4096 });
        await writeFile(join(storyDir, "style_guide.md"), response.content, "utf-8");
        return response.content;
    }
    /**
     * Import canon from parent book for spinoff writing.
     * Reads parent's truth files, uses LLM to generate parent_canon.md in target book.
     */
    async importCanon(targetBookId, parentBookId) {
        // Validate both books exist
        const bookIds = await this.state.listBooks();
        if (!bookIds.includes(parentBookId)) {
            throw new Error(`Parent book "${parentBookId}" not found. Available: ${bookIds.join(", ") || "(none)"}`);
        }
        if (!bookIds.includes(targetBookId)) {
            throw new Error(`Target book "${targetBookId}" not found. Available: ${bookIds.join(", ") || "(none)"}`);
        }
        const parentDir = this.state.bookDir(parentBookId);
        const targetDir = this.state.bookDir(targetBookId);
        const storyDir = join(targetDir, "story");
        await mkdir(storyDir, { recursive: true });
        const readSafe = async (path) => {
            try {
                return await readFile(path, "utf-8");
            }
            catch {
                return "(无)";
            }
        };
        const parentBook = await this.state.loadBookConfig(parentBookId);
        const [storyBible, currentState, ledger, hooks, summaries, subplots, emotions, matrix] = await Promise.all([
            readSafe(join(parentDir, "story/story_bible.md")),
            readSafe(join(parentDir, "story/current_state.md")),
            readSafe(join(parentDir, "story/particle_ledger.md")),
            readSafe(join(parentDir, "story/pending_hooks.md")),
            readSafe(join(parentDir, "story/chapter_summaries.md")),
            readSafe(join(parentDir, "story/subplot_board.md")),
            readSafe(join(parentDir, "story/emotional_arcs.md")),
            readSafe(join(parentDir, "story/character_matrix.md")),
        ]);
        const response = await chatCompletion(this.config.client, this.config.model, [
            {
                role: "system",
                content: `你是一位网络小说架构师。基于正传的全部设定和状态文件，生成一份完整的"正传正典参照"文档，供番外写作和审计使用。

输出格式（Markdown）：
# 正传正典（《{正传书名}》）

## 世界规则（完整，来自正传设定）
（力量体系、地理设定、阵营关系、核心规则——完整复制，不压缩）

## 正典约束（不可违反的事实）
| 约束ID | 类型 | 约束内容 | 严重性 |
|---|---|---|---|
| C01 | 人物存亡 | ... | critical |
（列出所有硬性约束：谁活着、谁死了、什么事件已经发生、什么规则不可违反）

## 角色快照
| 角色 | 当前状态 | 性格底色 | 对话特征 | 已知信息 | 未知信息 |
|---|---|---|---|---|---|
（从状态卡和角色矩阵中提取每个重要角色的完整快照）

## 角色双态处理原则
- 未来会变强的角色：写潜力暗示
- 未来会黑化的角色：写微小裂痕
- 未来会死的角色：写导致死亡的性格底色

## 关键事件时间线
| 章节 | 事件 | 涉及角色 | 对番外的约束 |
|---|---|---|---|
（从章节摘要中提取关键事件）

## 伏笔状态
| Hook ID | 类型 | 状态 | 内容 | 预期回收 |
|---|---|---|---|---|

## 资源账本快照
（当前资源状态）

---
meta:
  parentBookId: "{parentBookId}"
  parentTitle: "{正传书名}"
  generatedAt: "{ISO timestamp}"

要求：
1. 世界规则完整复制，不压缩——准确性优先
2. 正典约束必须穷尽，遗漏会导致番外与正传矛盾
3. 角色快照必须包含信息边界（已知/未知），防止番外中角色引用不该知道的信息`,
            },
            {
                role: "user",
                content: `正传书名：${parentBook.title}
正传ID：${parentBookId}

## 正传世界设定
${storyBible}

## 正传当前状态卡
${currentState}

## 正传资源账本
${ledger}

## 正传伏笔池
${hooks}

## 正传章节摘要
${summaries}

## 正传支线进度
${subplots}

## 正传情感弧线
${emotions}

## 正传角色矩阵
${matrix}`,
            },
        ], { temperature: 0.3, maxTokens: 16384 });
        // Append deterministic meta block (LLM may hallucinate timestamps)
        const metaBlock = [
            "",
            "---",
            "meta:",
            `  parentBookId: "${parentBookId}"`,
            `  parentTitle: "${parentBook.title}"`,
            `  generatedAt: "${new Date().toISOString()}"`,
        ].join("\n");
        const canon = response.content + metaBlock;
        await writeFile(join(storyDir, "parent_canon.md"), canon, "utf-8");
        // Also generate style guide from parent's chapter text if available
        const parentChaptersDir = join(parentDir, "chapters");
        const parentChapterText = await this.readParentChapterSample(parentChaptersDir);
        if (parentChapterText.length >= 500) {
            await this.tryGenerateStyleGuide(targetBookId, parentChapterText, parentBook.title);
        }
        return canon;
    }
    async readParentChapterSample(chaptersDir) {
        try {
            const entries = await readdir(chaptersDir);
            const mdFiles = entries
                .filter((file) => file.endsWith(".md"))
                .sort()
                .slice(0, 5);
            const chunks = [];
            let totalLength = 0;
            for (const file of mdFiles) {
                if (totalLength >= 20000)
                    break;
                const content = await readFile(join(chaptersDir, file), "utf-8");
                chunks.push(content);
                totalLength += content.length;
            }
            return chunks.join("\n\n---\n\n");
        }
        catch {
            return "";
        }
    }
    // ---------------------------------------------------------------------------
    // Chapter import (for continuation writing from existing chapters)
    // ---------------------------------------------------------------------------
    /**
     * Import existing chapters into a book. Reverse-engineers all truth files
     * via sequential replay so the Writer and Auditor can continue naturally.
     *
     * Step 1: Generate foundation (story_bible, volume_outline, book_rules) from all chapters.
     * Step 2: Sequentially replay each chapter through ChapterAnalyzer to build truth files.
     */
    async importChapters(input) {
        const releaseLock = await this.state.acquireBookLock(input.bookId);
        try {
            const book = await this.state.loadBookConfig(input.bookId);
            const bookDir = this.state.bookDir(input.bookId);
            const { profile: gp } = await this.loadGenreProfile(book.genre);
            const resolvedLanguage = book.language ?? gp.language;
            const startFrom = input.resumeFrom ?? 1;
            const log = this.config.logger?.child("import");
            // Step 1: Generate foundation on first run (not on resume)
            if (startFrom === 1) {
                log?.info(this.localize(resolvedLanguage, {
                    zh: `步骤 1：从 ${input.chapters.length} 章生成基础设定...`,
                    en: `Step 1: Generating foundation from ${input.chapters.length} chapters...`,
                }));
                const allText = input.chapters.map((c, i) => resolvedLanguage === "en"
                    ? `Chapter ${i + 1}: ${c.title}\n\n${c.content}`
                    : `第${i + 1}章 ${c.title}\n\n${c.content}`).join("\n\n---\n\n");
                const architect = new ArchitectAgent(this.agentCtxFor("architect", input.bookId));
                const isSeries = input.importMode === "series";
                const foundation = isSeries
                    ? await this.generateAndReviewFoundation({
                        generate: (reviewFeedback) => architect.generateFoundationFromImport(book, allText, undefined, reviewFeedback, { importMode: "series" }),
                        reviewer: new FoundationReviewerAgent(this.agentCtxFor("foundation-reviewer", input.bookId)),
                        mode: "series",
                        language: resolvedLanguage === "en" ? "en" : "zh",
                        stageLanguage: resolvedLanguage,
                    })
                    : await architect.generateFoundationFromImport(book, allText);
                await architect.writeFoundationFiles(bookDir, foundation, gp.numericalSystem, resolvedLanguage);
                await this.resetImportReplayTruthFiles(bookDir, resolvedLanguage);
                await this.state.saveChapterIndex(input.bookId, []);
                await this.state.snapshotState(input.bookId, 0);
                // Generate style guide from imported chapters
                if (allText.length >= 500) {
                    log?.info(this.localize(resolvedLanguage, {
                        zh: "提取原文风格指纹...",
                        en: "Extracting source style fingerprint...",
                    }));
                    await this.tryGenerateStyleGuide(input.bookId, allText, book.title, resolvedLanguage);
                }
                log?.info(this.localize(resolvedLanguage, {
                    zh: "基础设定已生成。",
                    en: "Foundation generated.",
                }));
            }
            // Step 2: Sequential replay
            log?.info(this.localize(resolvedLanguage, {
                zh: `步骤 2：从第 ${startFrom} 章开始顺序回放...`,
                en: `Step 2: Sequential replay from chapter ${startFrom}...`,
            }));
            const analyzer = new ChapterAnalyzerAgent(this.agentCtxFor("chapter-analyzer", input.bookId));
            const writer = new WriterAgent(this.agentCtxFor("writer", input.bookId));
            const countingMode = resolveLengthCountingMode(book.language ?? gp.language);
            let totalWords = 0;
            let importedCount = 0;
            for (let i = startFrom - 1; i < input.chapters.length; i++) {
                const ch = input.chapters[i];
                const chapterNumber = i + 1;
                const governedInput = await this.prepareWriteInput(book, bookDir, chapterNumber);
                log?.info(this.localize(resolvedLanguage, {
                    zh: `分析章节 ${chapterNumber}/${input.chapters.length}：${ch.title}...`,
                    en: `Analyzing chapter ${chapterNumber}/${input.chapters.length}: ${ch.title}...`,
                }));
                // Analyze chapter to get truth file updates
                const output = await analyzer.analyzeChapter({
                    book,
                    bookDir,
                    chapterNumber,
                    chapterContent: ch.content,
                    chapterTitle: ch.title,
                    chapterIntent: governedInput.chapterIntent,
                    contextPackage: governedInput.contextPackage,
                    ruleStack: governedInput.ruleStack,
                });
                // Save chapter file + core truth files (state, ledger, hooks)
                await writer.saveChapter(bookDir, {
                    ...output,
                    postWriteErrors: [],
                    postWriteWarnings: [],
                }, gp.numericalSystem, resolvedLanguage);
                // Save extended truth files (summaries, subplots, emotional arcs, character matrix)
                await writer.saveNewTruthFiles(bookDir, {
                    ...output,
                    postWriteErrors: [],
                    postWriteWarnings: [],
                }, resolvedLanguage);
                await this.syncLegacyStructuredStateFromMarkdown(bookDir, chapterNumber, output);
                await this.syncNarrativeMemoryIndex(input.bookId);
                // Update chapter index
                const existingIndex = await this.state.loadChapterIndex(input.bookId);
                const now = new Date().toISOString();
                const chapterWordCount = countChapterLength(ch.content, countingMode);
                const newEntry = {
                    number: chapterNumber,
                    title: output.title,
                    status: "imported",
                    wordCount: chapterWordCount,
                    createdAt: now,
                    updatedAt: now,
                    auditIssues: [],
                    lengthWarnings: [],
                };
                // Replace if exists (resume case), otherwise append
                const existingIdx = existingIndex.findIndex((e) => e.number === chapterNumber);
                const updatedIndex = existingIdx >= 0
                    ? existingIndex.map((e, idx) => idx === existingIdx ? newEntry : e)
                    : [...existingIndex, newEntry];
                await this.state.saveChapterIndex(input.bookId, updatedIndex);
                // Snapshot state after each chapter for rollback + resume support
                await this.state.snapshotState(input.bookId, chapterNumber);
                importedCount++;
                totalWords += chapterWordCount;
            }
            if (input.chapters.length > 0) {
                await this.markBookActiveIfNeeded(input.bookId);
                await this.syncCurrentStateFactHistory(input.bookId, input.chapters.length);
            }
            const nextChapter = input.chapters.length + 1;
            log?.info(this.localize(resolvedLanguage, {
                zh: `完成。已导入 ${importedCount} 章，共 ${formatLengthCount(totalWords, countingMode)}。下一章：${nextChapter}`,
                en: `Done. ${importedCount} chapters imported, ${formatLengthCount(totalWords, countingMode)}. Next chapter: ${nextChapter}`,
            }));
            return {
                bookId: input.bookId,
                importedCount,
                totalWords,
                nextChapter,
            };
        }
        finally {
            await releaseLock();
        }
    }
    static addUsage(a, b) {
        if (!b)
            return a;
        return {
            promptTokens: a.promptTokens + b.promptTokens,
            completionTokens: a.completionTokens + b.completionTokens,
            totalTokens: a.totalTokens + b.totalTokens,
        };
    }
    async buildPersistenceOutput(bookId, book, bookDir, chapterNumber, output, finalContent, countingMode, reducedControlInput) {
        if (finalContent === output.content) {
            return output;
        }
        const analyzer = new ChapterAnalyzerAgent(this.agentCtxFor("chapter-analyzer", bookId));
        const analyzed = await analyzer.analyzeChapter({
            book,
            bookDir,
            chapterNumber,
            chapterContent: finalContent,
            chapterTitle: output.title,
            chapterIntent: reducedControlInput?.chapterIntent,
            contextPackage: reducedControlInput?.contextPackage,
            ruleStack: reducedControlInput?.ruleStack,
        });
        return {
            ...analyzed,
            content: finalContent,
            wordCount: countChapterLength(finalContent, countingMode),
            postWriteErrors: [],
            postWriteWarnings: [],
            hookHealthIssues: output.hookHealthIssues,
            tokenUsage: output.tokenUsage,
        };
    }
    async assertNoPendingStateRepair(bookId) {
        const existingIndex = await this.state.loadChapterIndex(bookId);
        const latestChapter = [...existingIndex].sort((left, right) => right.number - left.number)[0];
        if (latestChapter?.status !== "state-degraded") {
            return;
        }
        throw new Error(`Latest chapter ${latestChapter.number} is state-degraded. Repair state or rewrite that chapter before continuing.`);
    }
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    async prepareWriteInput(book, bookDir, chapterNumber, externalContext) {
        if ((this.config.inputGovernanceMode ?? "v2") === "legacy") {
            return { externalContext };
        }
        const { plan, composed } = await this.createGovernedArtifacts(book, bookDir, chapterNumber, externalContext, { reuseExistingIntentWhenContextMissing: true });
        return {
            chapterIntent: plan.intentMarkdown,
            contextPackage: composed.contextPackage,
            ruleStack: composed.ruleStack,
            trace: composed.trace,
        };
    }
    async resetImportReplayTruthFiles(bookDir, language) {
        const storyDir = join(bookDir, "story");
        await Promise.all([
            writeFile(join(storyDir, "current_state.md"), this.buildImportReplayStateSeed(language), "utf-8"),
            writeFile(join(storyDir, "pending_hooks.md"), this.buildImportReplayHooksSeed(language), "utf-8"),
            rm(join(storyDir, "chapter_summaries.md"), { force: true }),
            rm(join(storyDir, "subplot_board.md"), { force: true }),
            rm(join(storyDir, "emotional_arcs.md"), { force: true }),
            rm(join(storyDir, "character_matrix.md"), { force: true }),
            rm(join(storyDir, "volume_summaries.md"), { force: true }),
            rm(join(storyDir, "particle_ledger.md"), { force: true }),
            rm(join(storyDir, "memory.db"), { force: true }),
            rm(join(storyDir, "memory.db-shm"), { force: true }),
            rm(join(storyDir, "memory.db-wal"), { force: true }),
            rm(join(storyDir, "state"), { recursive: true, force: true }),
            rm(join(storyDir, "snapshots"), { recursive: true, force: true }),
        ]);
    }
    buildImportReplayStateSeed(language) {
        if (language === "en") {
            return [
                "# Current State",
                "",
                "| Field | Value |",
                "| --- | --- |",
                "| Current Chapter | 0 |",
                "| Current Location | (not set) |",
                "| Protagonist State | (not set) |",
                "| Current Goal | (not set) |",
                "| Current Constraint | (not set) |",
                "| Current Alliances | (not set) |",
                "| Current Conflict | (not set) |",
                "",
            ].join("\n");
        }
        return [
            "# 当前状态",
            "",
            "| 字段 | 值 |",
            "| --- | --- |",
            "| 当前章节 | 0 |",
            "| 当前位置 | （未设定） |",
            "| 主角状态 | （未设定） |",
            "| 当前目标 | （未设定） |",
            "| 当前限制 | （未设定） |",
            "| 当前敌我 | （未设定） |",
            "| 当前冲突 | （未设定） |",
            "",
        ].join("\n");
    }
    buildImportReplayHooksSeed(language) {
        if (language === "en") {
            return [
                "# Pending Hooks",
                "",
                "| hook_id | start_chapter | type | status | last_advanced_chapter | expected_payoff | notes |",
                "| --- | --- | --- | --- | --- | --- | --- |",
                "",
            ].join("\n");
        }
        return [
            "# 伏笔池",
            "",
            "| hook_id | 起始章节 | 类型 | 状态 | 最近推进 | 预期回收 | 备注 |",
            "| --- | --- | --- | --- | --- | --- | --- |",
            "",
        ].join("\n");
    }
    async normalizeDraftLengthIfNeeded(params) {
        const writerCount = countChapterLength(params.chapterContent, params.lengthSpec.countingMode);
        if (!isOutsideSoftRange(writerCount, params.lengthSpec)) {
            return {
                content: params.chapterContent,
                wordCount: writerCount,
                applied: false,
            };
        }
        const normalizer = new LengthNormalizerAgent(this.agentCtxFor("length-normalizer", params.bookId));
        const normalized = await normalizer.normalizeChapter({
            chapterContent: params.chapterContent,
            lengthSpec: params.lengthSpec,
            chapterIntent: params.chapterIntent,
        });
        // Safety net: if normalizer output is less than 25% of original, it was too destructive.
        // Reject and keep original content.
        if (normalized.finalCount < writerCount * 0.25) {
            this.logWarn(this.languageFromLengthSpec(params.lengthSpec), {
                zh: `字数归一化被拒绝：第${params.chapterNumber}章 ${writerCount} -> ${normalized.finalCount}（砍了${Math.round((1 - normalized.finalCount / writerCount) * 100)}%，超过安全阈值）`,
                en: `Length normalization rejected for chapter ${params.chapterNumber}: ${writerCount} -> ${normalized.finalCount} (cut ${Math.round((1 - normalized.finalCount / writerCount) * 100)}%, exceeds safety threshold)`,
            });
            return {
                content: params.chapterContent,
                wordCount: writerCount,
                applied: false,
            };
        }
        this.logInfo(this.languageFromLengthSpec(params.lengthSpec), {
            zh: `审计前字数归一化：第${params.chapterNumber}章 ${writerCount} -> ${normalized.finalCount}`,
            en: `Length normalization before audit for chapter ${params.chapterNumber}: ${writerCount} -> ${normalized.finalCount}`,
        });
        return {
            content: normalized.normalizedContent,
            wordCount: normalized.finalCount,
            applied: normalized.applied,
            tokenUsage: normalized.tokenUsage,
        };
    }
    assertChapterContentNotEmpty(content, chapterNumber, stage) {
        if (content.trim().length > 0)
            return;
        throw new Error(`Chapter ${chapterNumber} has empty chapter content after ${stage}`);
    }
    async syncCurrentStateFactHistory(bookId, uptoChapter) {
        const bookDir = this.state.bookDir(bookId);
        try {
            await this.rebuildCurrentStateFactHistory(bookDir, uptoChapter);
        }
        catch (error) {
            if (this.isMemoryIndexUnavailableError(error)) {
                if (this.canOpenMemoryIndex(bookDir)) {
                    try {
                        await this.rebuildCurrentStateFactHistory(bookDir, uptoChapter);
                        return;
                    }
                    catch (retryError) {
                        error = retryError;
                    }
                }
                else {
                    if (!this.memoryIndexFallbackWarned) {
                        this.memoryIndexFallbackWarned = true;
                        this.logWarn(await this.resolveBookLanguageById(bookId), {
                            zh: "当前 Node 运行时不支持 SQLite 记忆索引，继续使用 Markdown 回退方案。",
                            en: "SQLite memory index unavailable on this Node runtime; continuing with markdown fallback.",
                        });
                        await this.logMemoryIndexDebugInfo(bookId, error);
                    }
                    return;
                }
            }
            this.logWarn(await this.resolveBookLanguageById(bookId), {
                zh: `状态事实同步已跳过：${String(error)}`,
                en: `State fact sync skipped: ${String(error)}`,
            });
        }
    }
    async syncLegacyStructuredStateFromMarkdown(bookDir, chapterNumber, output) {
        if (output?.runtimeStateDelta || output?.runtimeStateSnapshot) {
            return;
        }
        await rewriteStructuredStateFromMarkdown({
            bookDir,
            fallbackChapter: chapterNumber,
        });
    }
    async syncNarrativeMemoryIndex(bookId) {
        const bookDir = this.state.bookDir(bookId);
        try {
            await this.rebuildNarrativeMemoryIndex(bookDir);
        }
        catch (error) {
            if (this.isMemoryIndexUnavailableError(error)) {
                if (this.canOpenMemoryIndex(bookDir)) {
                    try {
                        await this.rebuildNarrativeMemoryIndex(bookDir);
                        return;
                    }
                    catch (retryError) {
                        error = retryError;
                    }
                }
                else {
                    if (!this.memoryIndexFallbackWarned) {
                        this.memoryIndexFallbackWarned = true;
                        this.logWarn(await this.resolveBookLanguageById(bookId), {
                            zh: "当前 Node 运行时不支持 SQLite 记忆索引，继续使用 Markdown 回退方案。",
                            en: "SQLite memory index unavailable on this Node runtime; continuing with markdown fallback.",
                        });
                        await this.logMemoryIndexDebugInfo(bookId, error);
                    }
                    return;
                }
            }
            this.logWarn(await this.resolveBookLanguageById(bookId), {
                zh: `叙事记忆同步已跳过：${String(error)}`,
                en: `Narrative memory sync skipped: ${String(error)}`,
            });
        }
    }
    async rebuildCurrentStateFactHistory(bookDir, uptoChapter) {
        const memoryDb = await this.withMemoryIndexRetry(async () => {
            const db = new MemoryDB(bookDir);
            try {
                db.resetFacts();
                const activeFacts = new Map();
                for (let chapter = 0; chapter <= uptoChapter; chapter++) {
                    const snapshotFacts = await loadSnapshotCurrentStateFacts(bookDir, chapter);
                    if (snapshotFacts.length === 0)
                        continue;
                    const nextFacts = new Map();
                    for (const fact of snapshotFacts) {
                        nextFacts.set(this.factKey(fact), {
                            subject: fact.subject,
                            predicate: fact.predicate,
                            object: fact.object,
                            validFromChapter: chapter,
                            validUntilChapter: null,
                            sourceChapter: chapter,
                        });
                    }
                    for (const [key, previous] of activeFacts.entries()) {
                        const next = nextFacts.get(key);
                        if (!next || next.object !== previous.object) {
                            db.invalidateFact(previous.id, chapter);
                            activeFacts.delete(key);
                        }
                    }
                    for (const [key, fact] of nextFacts.entries()) {
                        if (activeFacts.has(key))
                            continue;
                        const id = db.addFact(fact);
                        activeFacts.set(key, { id, object: fact.object });
                    }
                }
                return db;
            }
            catch (error) {
                db.close();
                throw error;
            }
        });
        try {
            // No-op: keep the db open only for the duration of the rebuild.
        }
        finally {
            memoryDb.close();
        }
    }
    async rebuildNarrativeMemoryIndex(bookDir) {
        const memorySeed = await loadNarrativeMemorySeed(bookDir);
        const memoryDb = await this.withMemoryIndexRetry(() => {
            const db = new MemoryDB(bookDir);
            try {
                db.replaceSummaries(memorySeed.summaries);
                db.replaceHooks(memorySeed.hooks);
                return db;
            }
            catch (error) {
                db.close();
                throw error;
            }
        });
        try {
            // No-op: keep the db open only for the duration of the rebuild.
        }
        finally {
            memoryDb.close();
        }
    }
    canOpenMemoryIndex(bookDir) {
        let memoryDb = null;
        try {
            memoryDb = new MemoryDB(bookDir);
            return true;
        }
        catch {
            return false;
        }
        finally {
            memoryDb?.close();
        }
    }
    async logMemoryIndexDebugInfo(bookId, error) {
        if (process.env.INKOS_DEBUG_SQLITE_MEMORY !== "1") {
            return;
        }
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code ?? "")
            : "";
        const message = error instanceof Error
            ? error.message
            : String(error);
        this.logWarn(await this.resolveBookLanguageById(bookId), {
            zh: `SQLite 记忆索引调试：node=${process.version}; execArgv=${JSON.stringify(process.execArgv)}; code=${code || "(none)"}; message=${message}`,
            en: `SQLite memory debug: node=${process.version}; execArgv=${JSON.stringify(process.execArgv)}; code=${code || "(none)"}; message=${message}`,
        });
    }
    async withMemoryIndexRetry(operation) {
        const retryDelaysMs = [0, 25, 75];
        let lastError;
        for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (!this.isMemoryIndexBusyError(error) || attempt === retryDelaysMs.length - 1) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt + 1]));
            }
        }
        throw lastError;
    }
    isMemoryIndexUnavailableError(error) {
        if (!error)
            return false;
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code ?? "")
            : "";
        const message = error instanceof Error
            ? error.message
            : String(error);
        const normalizedMessage = message.trim();
        return /^No such built-in module:\s*node:sqlite$/i.test(normalizedMessage)
            || /^Cannot find module ['"]node:sqlite['"]$/i.test(normalizedMessage)
            || (code === "ERR_UNKNOWN_BUILTIN_MODULE" && /\bnode:sqlite\b/i.test(normalizedMessage));
    }
    isMemoryIndexBusyError(error) {
        if (!error)
            return false;
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code ?? "")
            : "";
        const message = error instanceof Error
            ? error.message
            : String(error);
        return code === "SQLITE_BUSY"
            || code === "SQLITE_LOCKED"
            || /\bSQLITE_BUSY\b/i.test(message)
            || /\bSQLITE_LOCKED\b/i.test(message)
            || /database is locked/i.test(message)
            || /database is busy/i.test(message);
    }
    factKey(fact) {
        return `${fact.subject}::${fact.predicate}`;
    }
    buildLengthWarnings(chapterNumber, finalCount, lengthSpec) {
        if (!isOutsideHardRange(finalCount, lengthSpec)) {
            return [];
        }
        return [
            this.localize(this.languageFromLengthSpec(lengthSpec), {
                zh: `第${chapterNumber}章经过一次字数归一化后仍超出硬区间（${lengthSpec.hardMin}-${lengthSpec.hardMax}，实际 ${finalCount}）。`,
                en: `Chapter ${chapterNumber} remains outside hard range (${lengthSpec.hardMin}-${lengthSpec.hardMax}, actual ${finalCount}) after a single normalization pass.`,
            }),
        ];
    }
    buildLengthTelemetry(params) {
        return {
            target: params.lengthSpec.target,
            softMin: params.lengthSpec.softMin,
            softMax: params.lengthSpec.softMax,
            hardMin: params.lengthSpec.hardMin,
            hardMax: params.lengthSpec.hardMax,
            countingMode: params.lengthSpec.countingMode,
            writerCount: params.writerCount,
            postWriterNormalizeCount: params.postWriterNormalizeCount,
            postReviseCount: params.postReviseCount,
            finalCount: params.finalCount,
            normalizeApplied: params.normalizeApplied,
            lengthWarning: params.lengthWarning,
        };
    }
    async persistAuditDriftGuidance(params) {
        const storyDir = join(params.bookDir, "story");
        const driftPath = join(storyDir, "audit_drift.md");
        const statePath = join(storyDir, "current_state.md");
        const currentState = await readFile(statePath, "utf-8").catch(() => "");
        const sanitizedState = this.stripAuditDriftCorrectionBlock(currentState).trimEnd();
        if (sanitizedState !== currentState) {
            await writeFile(statePath, sanitizedState, "utf-8");
        }
        if (params.issues.length === 0) {
            await rm(driftPath, { force: true }).catch(() => undefined);
            return;
        }
        const block = [
            this.localize(params.language, {
                zh: "# 审计纠偏",
                en: "# Audit Drift",
            }),
            "",
            this.localize(params.language, {
                zh: "## 审计纠偏（自动生成，下一章写作前参照）",
                en: "## Audit Drift Correction",
            }),
            "",
            this.localize(params.language, {
                zh: `> 第${params.chapterNumber}章审计发现以下问题，下一章写作时必须避免：`,
                en: `> Chapter ${params.chapterNumber} audit found the following issues to avoid in the next chapter:`,
            }),
            ...params.issues.map((issue) => `> - [${issue.severity}] ${issue.category}: ${issue.description}`),
            "",
        ].join("\n");
        await writeFile(driftPath, block, "utf-8");
    }
    stripAuditDriftCorrectionBlock(currentState) {
        const headers = [
            "## 审计纠偏（自动生成，下一章写作前参照）",
            "## Audit Drift Correction",
            "# 审计纠偏",
            "# Audit Drift",
        ];
        let cutIndex = -1;
        for (const header of headers) {
            const index = currentState.indexOf(header);
            if (index >= 0 && (cutIndex < 0 || index < cutIndex)) {
                cutIndex = index;
            }
        }
        if (cutIndex < 0) {
            return currentState;
        }
        return currentState.slice(0, cutIndex).trimEnd();
    }
    logLengthWarnings(lengthWarnings) {
        for (const warning of lengthWarnings) {
            this.config.logger?.warn(warning);
        }
    }
    restoreLostAuditIssues(previous, next) {
        if (next.passed || next.issues.length > 0 || previous.issues.length === 0) {
            return next;
        }
        return {
            ...next,
            issues: previous.issues,
            summary: next.summary || previous.summary,
        };
    }
    restoreActionableAuditIfLost(previous, next) {
        const auditResult = this.restoreLostAuditIssues(previous.auditResult, next.auditResult);
        if (auditResult === next.auditResult) {
            return next;
        }
        return {
            ...next,
            auditResult,
            revisionBlockingIssues: previous.revisionBlockingIssues,
            blockingCount: previous.blockingCount,
            criticalCount: previous.criticalCount,
        };
    }
    async evaluateMergedAudit(params) {
        const llmAudit = await params.auditor.auditChapter(params.bookDir, params.chapterContent, params.chapterNumber, params.book.genre, params.auditOptions);
        const aiTells = analyzeAITells(params.chapterContent, params.language);
        const sensitiveResult = analyzeSensitiveWords(params.chapterContent, undefined, params.language);
        const longSpanFatigue = await analyzeLongSpanFatigue({
            bookDir: params.bookDir,
            chapterNumber: params.chapterNumber,
            chapterContent: params.chapterContent,
            language: params.language,
        });
        const hasBlockedWords = sensitiveResult.found.some((f) => f.severity === "block");
        const issues = [
            ...llmAudit.issues,
            ...aiTells.issues,
            ...sensitiveResult.issues,
            ...longSpanFatigue.issues,
        ];
        // revisionBlockingIssues excludes long-span-fatigue issues by
        // construction (not by category name) so that an LLM-reported issue
        // sharing a category label with a long-span issue is still counted.
        const revisionBlockingIssues = [
            ...llmAudit.issues,
            ...aiTells.issues,
            ...sensitiveResult.issues,
        ];
        return {
            auditResult: {
                passed: hasBlockedWords ? false : llmAudit.passed,
                issues,
                summary: llmAudit.summary,
                tokenUsage: llmAudit.tokenUsage,
            },
            aiTellCount: aiTells.issues.length,
            blockingCount: revisionBlockingIssues.filter((issue) => issue.severity === "warning" || issue.severity === "critical").length,
            criticalCount: revisionBlockingIssues.filter((issue) => issue.severity === "critical").length,
            revisionBlockingIssues,
        };
    }
    async markBookActiveIfNeeded(bookId) {
        const book = await this.state.loadBookConfig(bookId);
        if (book.status !== "outlining")
            return;
        await this.state.saveBookConfig(bookId, {
            ...book,
            status: "active",
            updatedAt: new Date().toISOString(),
        });
    }
    async createGovernedArtifacts(book, bookDir, chapterNumber, externalContext, options) {
        const plan = await this.resolveGovernedPlan(book, bookDir, chapterNumber, externalContext, options);
        const composer = new ComposerAgent(this.agentCtxFor("composer", book.id));
        const composed = await composer.composeChapter({
            book,
            bookDir,
            chapterNumber,
            plan,
        });
        return { plan, composed };
    }
    async resolveGovernedPlan(book, bookDir, chapterNumber, externalContext, options) {
        if (options?.reuseExistingIntentWhenContextMissing &&
            (!externalContext || externalContext.trim().length === 0)) {
            const persisted = await loadPersistedPlan(bookDir, chapterNumber);
            if (persisted)
                return persisted;
        }
        const planner = new PlannerAgent(this.agentCtxFor("planner", book.id));
        return planner.planChapter({
            book,
            bookDir,
            chapterNumber,
            externalContext,
        });
    }
    async emitWebhook(event, bookId, chapterNumber, data) {
        if (!this.config.notifyChannels || this.config.notifyChannels.length === 0)
            return;
        await dispatchWebhookEvent(this.config.notifyChannels, {
            event,
            bookId,
            chapterNumber,
            timestamp: new Date().toISOString(),
            data,
        });
    }
    async readChapterContent(bookDir, chapterNumber) {
        const chaptersDir = join(bookDir, "chapters");
        const files = await readdir(chaptersDir);
        const paddedNum = String(chapterNumber).padStart(4, "0");
        const chapterFile = files.find((f) => f.startsWith(paddedNum) && f.endsWith(".md"));
        if (!chapterFile) {
            throw new Error(`Chapter ${chapterNumber} file not found in ${chaptersDir}`);
        }
        const raw = await readFile(join(chaptersDir, chapterFile), "utf-8");
        // Strip the title line
        const lines = raw.split("\n");
        const contentStart = lines.findIndex((l, i) => i > 0 && l.trim().length > 0);
        return contentStart >= 0 ? lines.slice(contentStart).join("\n") : raw;
    }
}
//# sourceMappingURL=runner.js.map