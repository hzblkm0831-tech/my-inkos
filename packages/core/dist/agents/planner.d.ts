import { BaseAgent } from "./base.js";
import type { BookConfig } from "../models/book.js";
import { type ChapterIntent } from "../models/input-governance.js";
export interface PlanChapterInput {
    readonly book: BookConfig;
    readonly bookDir: string;
    readonly chapterNumber: number;
    readonly externalContext?: string;
}
export interface PlanChapterOutput {
    readonly intent: ChapterIntent;
    readonly intentMarkdown: string;
    readonly plannerInputs: ReadonlyArray<string>;
    readonly runtimePath: string;
}
export declare class PlannerAgent extends BaseAgent {
    get name(): string;
    planChapter(input: PlanChapterInput): Promise<PlanChapterOutput>;
    private buildStructuredDirectives;
    private deriveGoal;
    private collectMustKeep;
    private collectMustAvoid;
    private collectStyleEmphasis;
    private collectConflicts;
    private extractFirstDirective;
    private extractListItems;
    private extractFocusGoal;
    private extractLocalOverrideGoal;
    private extractFocusStyleItems;
    private buildArcDirective;
    private buildSceneDirective;
    private buildMoodDirective;
    private buildTitleDirective;
    private renderHookBudget;
    private extractSection;
    private normalizeHeading;
    private cleanListItem;
    private isTemplatePlaceholder;
    private containsChinese;
    private findOutlineNode;
    private cleanOutlineContent;
    private findNextOutlineContent;
    private hasMatchedOutlineAnchor;
    private matchExactOutlineLine;
    private matchAnyExactOutlineLine;
    private matchRangeOutlineLine;
    private matchAnyRangeOutlineLine;
    private isOutlineAnchorLine;
    private isChapterWithinRange;
    private hasKeywordOverlap;
    private extractKeywords;
    private renderIntentMarkdown;
    private unique;
    private isChineseLanguage;
    private readFileOrDefault;
}
//# sourceMappingURL=planner.d.ts.map