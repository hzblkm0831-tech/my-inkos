import { BaseAgent } from "./base.js";
import type { BookConfig } from "../models/book.js";
import type { ContextPackage, RuleStack } from "../models/input-governance.js";
import { type ParsedWriterOutput } from "./writer-parser.js";
export interface AnalyzeChapterInput {
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly chapterContent: string;
    readonly chapterTitle?: string;
    readonly chapterIntent?: string;
    readonly contextPackage?: ContextPackage;
    readonly ruleStack?: RuleStack;
}
export type AnalyzeChapterOutput = ParsedWriterOutput;
export declare class ChapterAnalyzerAgent extends BaseAgent {
    get name(): string;
    analyzeChapter(input: AnalyzeChapterInput): Promise<AnalyzeChapterOutput>;
    private buildSystemPrompt;
    private buildUserPrompt;
    private buildReducedControlBlock;
    private buildMemoryGoal;
    private findOutlineNode;
    private renderSummarySnapshot;
    private escapeTableCell;
    private readFileOrDefault;
    private missingFilePlaceholder;
    private defaultChapterTitle;
}
//# sourceMappingURL=chapter-analyzer.d.ts.map