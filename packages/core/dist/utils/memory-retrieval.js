import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ChapterSummariesStateSchema, CurrentStateStateSchema, HooksStateSchema, } from "../models/runtime-state.js";
import { MemoryDB } from "../state/memory-db.js";
import { bootstrapStructuredStateFromMarkdown } from "../state/state-bootstrap.js";
import { filterActiveHooks, isFuturePlannedHook, isHookWithinChapterWindow, } from "./hook-agenda.js";
import { parseChapterSummariesMarkdown, parseCurrentStateFacts, parsePendingHooksMarkdown, } from "./story-markdown.js";
export { buildPlannerHookAgenda, isFuturePlannedHook, isHookWithinChapterWindow, } from "./hook-agenda.js";
export { parseChapterSummariesMarkdown, parseCurrentStateFacts, parsePendingHooksMarkdown, renderHookSnapshot, renderSummarySnapshot, } from "./story-markdown.js";
export async function retrieveMemorySelection(params) {
    const storyDir = join(params.bookDir, "story");
    const stateDir = join(storyDir, "state");
    const fallbackChapter = Math.max(0, params.chapterNumber - 1);
    await bootstrapStructuredStateFromMarkdown({
        bookDir: params.bookDir,
        fallbackChapter,
    }).catch(() => undefined);
    const [currentStateMarkdown, volumeSummariesMarkdown, structuredCurrentState, structuredHooks, structuredSummaries,] = await Promise.all([
        readFile(join(storyDir, "current_state.md"), "utf-8").catch(() => ""),
        readFile(join(storyDir, "volume_summaries.md"), "utf-8").catch(() => ""),
        readStructuredState(join(stateDir, "current_state.json"), CurrentStateStateSchema),
        readStructuredState(join(stateDir, "hooks.json"), HooksStateSchema),
        readStructuredState(join(stateDir, "chapter_summaries.json"), ChapterSummariesStateSchema),
    ]);
    const facts = structuredCurrentState?.facts ?? parseCurrentStateFacts(currentStateMarkdown, fallbackChapter);
    const narrativeQueryTerms = extractQueryTerms(params.goal, params.outlineNode, []);
    const factQueryTerms = extractQueryTerms(params.goal, params.outlineNode, params.mustKeep ?? []);
    const volumeSummaries = selectRelevantVolumeSummaries(parseVolumeSummariesMarkdown(volumeSummariesMarkdown), narrativeQueryTerms);
    const memoryDb = openMemoryDB(params.bookDir);
    if (memoryDb) {
        try {
            if (memoryDb.getChapterCount() === 0) {
                const summaries = structuredSummaries?.rows ?? parseChapterSummariesMarkdown(await readFile(join(storyDir, "chapter_summaries.md"), "utf-8").catch(() => ""));
                if (summaries.length > 0) {
                    memoryDb.replaceSummaries(summaries);
                }
            }
            if (memoryDb.getActiveHooks().length === 0) {
                const hooks = structuredHooks?.hooks ?? parsePendingHooksMarkdown(await readFile(join(storyDir, "pending_hooks.md"), "utf-8").catch(() => ""));
                if (hooks.length > 0) {
                    memoryDb.replaceHooks(hooks);
                }
            }
            if (memoryDb.getCurrentFacts().length === 0 && facts.length > 0) {
                memoryDb.replaceCurrentFacts(facts);
            }
            const activeHooks = memoryDb.getActiveHooks();
            return {
                summaries: selectRelevantSummaries(memoryDb.getSummaries(1, Math.max(1, params.chapterNumber - 1)), params.chapterNumber, narrativeQueryTerms),
                hooks: selectRelevantHooks(activeHooks, narrativeQueryTerms, params.chapterNumber),
                activeHooks,
                facts: selectRelevantFacts(memoryDb.getCurrentFacts(), factQueryTerms),
                volumeSummaries,
                dbPath: join(storyDir, "memory.db"),
            };
        }
        finally {
            memoryDb.close();
        }
    }
    const [summariesMarkdown, hooksMarkdown] = await Promise.all([
        readFile(join(storyDir, "chapter_summaries.md"), "utf-8").catch(() => ""),
        readFile(join(storyDir, "pending_hooks.md"), "utf-8").catch(() => ""),
    ]);
    const summaries = structuredSummaries?.rows ?? parseChapterSummariesMarkdown(summariesMarkdown);
    const hooks = structuredHooks?.hooks ?? parsePendingHooksMarkdown(hooksMarkdown);
    const activeHooks = filterActiveHooks(hooks);
    return {
        summaries: selectRelevantSummaries(summaries, params.chapterNumber, narrativeQueryTerms),
        hooks: selectRelevantHooks(activeHooks, narrativeQueryTerms, params.chapterNumber),
        activeHooks,
        facts: selectRelevantFacts(facts, factQueryTerms),
        volumeSummaries,
    };
}
export function extractQueryTerms(goal, outlineNode, mustKeep) {
    const primaryTerms = uniqueTerms([
        ...extractTermsFromText(stripNegativeGuidance(goal)),
        ...mustKeep.flatMap((item) => extractTermsFromText(item)),
    ]);
    if (primaryTerms.length >= 2) {
        return primaryTerms.slice(0, 12);
    }
    return uniqueTerms([
        ...primaryTerms,
        ...extractTermsFromText(stripNegativeGuidance(outlineNode ?? "")),
    ]).slice(0, 12);
}
function openMemoryDB(bookDir) {
    try {
        return new MemoryDB(bookDir);
    }
    catch {
        return null;
    }
}
async function readStructuredState(path, schema) {
    try {
        const raw = await readFile(path, "utf-8");
        return schema.parse(JSON.parse(raw));
    }
    catch {
        return null;
    }
}
function buildLegacyQueryTerms(goal, outlineNode, mustKeep) {
    const stopWords = new Set([
        "bring", "focus", "back", "chapter", "clear", "narrative", "before", "opening",
        "track", "the", "with", "from", "that", "this", "into", "still", "cannot",
        "current", "state", "advance", "conflict", "story", "keep", "must", "local",
    ]);
    const source = [goal, outlineNode ?? "", ...mustKeep].join(" ");
    const english = source.match(/[a-z]{4,}/gi) ?? [];
    const chinese = source.match(/[\u4e00-\u9fff]{2,4}/g) ?? [];
    return [...new Set([...english, ...chinese]
            .map((term) => term.trim())
            .filter((term) => term.length >= 2)
            .filter((term) => !stopWords.has(term.toLowerCase())))].slice(0, 12);
}
function extractTermsFromText(text) {
    if (!text.trim())
        return [];
    const stopWords = new Set([
        "bring", "focus", "back", "chapter", "clear", "narrative", "before", "opening",
        "track", "the", "with", "from", "that", "this", "into", "still", "cannot",
        "current", "state", "advance", "conflict", "story", "keep", "must", "local",
        "does", "not", "only", "just", "then", "than",
    ]);
    const normalized = text.replace(/第\d+章/g, " ");
    const english = (normalized.match(/[a-z]{4,}/gi) ?? [])
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
        .filter((term) => !stopWords.has(term.toLowerCase()));
    const chineseSegments = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
    const chinese = chineseSegments.flatMap((segment) => extractChineseFocusTerms(segment));
    return [...english, ...chinese];
}
function extractChineseFocusTerms(segment) {
    const stripped = segment
        .replace(/^(本章|继续|重新|拉回|回到|推进|优先|围绕|聚焦|坚持|保持|把注意力|注意力|将注意力|请把注意力|先把注意力)+/, "")
        .replace(/^(处理|推进|回拉|拉回到)+/, "")
        .trim();
    const target = stripped.length >= 2 ? stripped : segment;
    const terms = new Set();
    if (target.length <= 4) {
        terms.add(target);
    }
    for (let size = 2; size <= 4; size += 1) {
        if (target.length >= size) {
            terms.add(target.slice(-size));
        }
    }
    return [...terms].filter((term) => term.length >= 2);
}
function stripNegativeGuidance(text) {
    if (!text)
        return "";
    return text
        .replace(/\b(do not|don't|avoid|without|instead of)\b[\s\S]*$/i, " ")
        .replace(/(?:不要|不让|别|禁止|避免|但不允许)[\s\S]*$/u, " ")
        .trim();
}
function uniqueTerms(terms) {
    const result = [];
    const seen = new Set();
    for (const term of terms) {
        const normalized = term.trim().toLowerCase();
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        result.push(term.trim());
    }
    return result;
}
function parseVolumeSummariesMarkdown(markdown) {
    if (!markdown.trim())
        return [];
    const sections = markdown
        .split(/^##\s+/m)
        .map((section) => section.trim())
        .filter(Boolean);
    return sections.map((section) => {
        const [headingLine, ...bodyLines] = section.split("\n");
        const heading = headingLine?.trim() ?? "";
        const content = bodyLines.join("\n").trim();
        return {
            heading,
            content,
            anchor: slugifyAnchor(heading),
        };
    }).filter((section) => section.heading.length > 0 && section.content.length > 0);
}
function isUnresolvedHook(status) {
    return status.trim().length === 0 || /open|待定|推进|active|progressing/i.test(status);
}
function selectRelevantSummaries(summaries, chapterNumber, queryTerms) {
    return summaries
        .filter((summary) => summary.chapter < chapterNumber)
        .map((summary) => ({
        summary,
        score: scoreSummary(summary, chapterNumber, queryTerms),
        matched: matchesAny([
            summary.title,
            summary.characters,
            summary.events,
            summary.stateChanges,
            summary.hookActivity,
            summary.chapterType,
        ].join(" "), queryTerms),
    }))
        .filter((entry) => entry.matched || entry.summary.chapter >= chapterNumber - 3)
        .sort((left, right) => right.score - left.score || right.summary.chapter - left.summary.chapter)
        .slice(0, 4)
        .map((entry) => entry.summary)
        .sort((left, right) => left.chapter - right.chapter);
}
function selectRelevantHooks(hooks, queryTerms, chapterNumber) {
    const ranked = hooks
        .map((hook) => ({
        hook,
        score: scoreHook(hook, queryTerms, chapterNumber),
        matched: matchesAny([hook.hookId, hook.type, hook.expectedPayoff, hook.payoffTiming ?? "", hook.notes].join(" "), queryTerms),
    }))
        .filter((entry) => entry.matched || isUnresolvedHook(entry.hook.status));
    const primary = ranked
        .filter((entry) => entry.matched || isHookWithinChapterWindow(entry.hook, chapterNumber, 5))
        .sort((left, right) => right.score - left.score || right.hook.lastAdvancedChapter - left.hook.lastAdvancedChapter)
        .slice(0, 6);
    const selectedIds = new Set(primary.map((entry) => entry.hook.hookId));
    const stale = ranked
        .filter((entry) => !selectedIds.has(entry.hook.hookId)
        && !isFuturePlannedHook(entry.hook, chapterNumber)
        && isUnresolvedHook(entry.hook.status))
        .sort((left, right) => left.hook.lastAdvancedChapter - right.hook.lastAdvancedChapter || right.score - left.score)
        .slice(0, 2);
    return [...primary, ...stale].map((entry) => entry.hook);
}
function selectRelevantFacts(facts, queryTerms) {
    const prioritizedPredicates = [
        /^(当前冲突|current conflict)$/i,
        /^(当前目标|current goal)$/i,
        /^(主角状态|protagonist state)$/i,
        /^(当前限制|current constraint)$/i,
        /^(当前位置|current location)$/i,
        /^(当前敌我|current alliances|current relationships)$/i,
    ];
    return facts
        .map((fact) => {
        const text = [fact.subject, fact.predicate, fact.object].join(" ");
        const priority = prioritizedPredicates.findIndex((pattern) => pattern.test(fact.predicate));
        const baseScore = priority === -1 ? 5 : 20 - priority * 2;
        const termScore = queryTerms.reduce((score, term) => score + (includesTerm(text, term) ? Math.max(8, term.length * 2) : 0), 0);
        return {
            fact,
            score: baseScore + termScore,
            matched: matchesAny(text, queryTerms),
        };
    })
        .filter((entry) => entry.matched || entry.score >= 14)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4)
        .map((entry) => entry.fact);
}
function selectRelevantVolumeSummaries(summaries, queryTerms) {
    if (summaries.length === 0)
        return [];
    const ranked = summaries
        .map((summary, index) => {
        const text = `${summary.heading} ${summary.content}`;
        const termScore = queryTerms.reduce((score, term) => score + (includesTerm(text, term) ? Math.max(8, term.length * 2) : 0), 0);
        return {
            index,
            summary,
            score: termScore + index,
            matched: matchesAny(text, queryTerms),
        };
    })
        .filter((entry, index, all) => entry.matched || index === all.length - 1)
        .sort((left, right) => right.score - left.score)
        .slice(0, 2)
        .sort((left, right) => left.index - right.index)
        .map((entry) => entry.summary);
    return ranked;
}
function scoreSummary(summary, chapterNumber, queryTerms) {
    const text = [
        summary.title,
        summary.characters,
        summary.events,
        summary.stateChanges,
        summary.hookActivity,
        summary.chapterType,
    ].join(" ");
    const age = Math.max(0, chapterNumber - summary.chapter);
    const recencyScore = Math.max(0, 12 - age);
    const termScore = queryTerms.reduce((score, term) => score + (includesTerm(text, term) ? Math.max(8, term.length * 2) : 0), 0);
    return recencyScore + termScore;
}
function scoreHook(hook, queryTerms, _chapterNumber) {
    const text = [hook.hookId, hook.type, hook.expectedPayoff, hook.payoffTiming ?? "", hook.notes].join(" ");
    const freshness = Math.max(0, hook.lastAdvancedChapter);
    const termScore = queryTerms.reduce((score, term) => score + (includesTerm(text, term) ? Math.max(8, term.length * 2) : 0), 0);
    return termScore + freshness;
}
function matchesAny(text, queryTerms) {
    return queryTerms.some((term) => includesTerm(text, term));
}
function includesTerm(text, term) {
    return text.toLowerCase().includes(term.toLowerCase());
}
function slugifyAnchor(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-+|-+$/g, "")
        || "volume-summary";
}
//# sourceMappingURL=memory-retrieval.js.map