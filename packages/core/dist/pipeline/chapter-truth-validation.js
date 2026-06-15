import { buildStateDegradedPersistenceOutput, retrySettlementAfterValidationFailure, } from "./chapter-state-recovery.js";
export async function validateChapterTruthPersistence(params) {
    let validation;
    let chapterStatus = null;
    let degradedIssues = [];
    let persistenceOutput = params.persistenceOutput;
    let auditResult = params.auditResult;
    try {
        validation = await params.validator.validate(params.content, params.chapterNumber, params.previousTruth.oldState, persistenceOutput.updatedState, params.previousTruth.oldHooks, persistenceOutput.updatedHooks, params.language);
    }
    catch (error) {
        throw new Error(`State validation failed for chapter ${params.chapterNumber}: ${String(error)}`);
    }
    if (validation.warnings.length > 0) {
        params.logWarn({
            zh: `状态校验：第${params.chapterNumber}章发现 ${validation.warnings.length} 条警告`,
            en: `State validation: ${validation.warnings.length} warning(s) for chapter ${params.chapterNumber}`,
        });
        for (const warning of validation.warnings) {
            params.logger?.warn(`  [${warning.category}] ${warning.description}`);
        }
    }
    if (!validation.passed) {
        const recovery = await retrySettlementAfterValidationFailure({
            writer: params.writer,
            validator: params.validator,
            book: params.book,
            bookDir: params.bookDir,
            chapterNumber: params.chapterNumber,
            title: params.title,
            content: params.content,
            reducedControlInput: params.reducedControlInput,
            oldState: params.previousTruth.oldState,
            oldHooks: params.previousTruth.oldHooks,
            originalValidation: validation,
            language: params.language,
            logWarn: params.logWarn,
            logger: params.logger,
        });
        if (recovery.kind === "recovered") {
            persistenceOutput = recovery.output;
            validation = recovery.validation;
        }
        else {
            chapterStatus = "state-degraded";
            degradedIssues = recovery.issues;
            persistenceOutput = buildStateDegradedPersistenceOutput({
                output: persistenceOutput,
                oldState: params.previousTruth.oldState,
                oldHooks: params.previousTruth.oldHooks,
                oldLedger: params.previousTruth.oldLedger,
            });
            auditResult = {
                ...auditResult,
                issues: [...auditResult.issues, ...recovery.issues],
            };
        }
    }
    return {
        validation,
        chapterStatus,
        degradedIssues,
        persistenceOutput,
        auditResult,
    };
}
//# sourceMappingURL=chapter-truth-validation.js.map