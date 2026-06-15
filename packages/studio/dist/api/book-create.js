export function normalizeStudioPlatform(platform) {
    switch (platform) {
        case "tomato":
        case "feilu":
        case "qidian":
            return platform;
        default:
            return "other";
    }
}
export function buildStudioBookConfig(body, now) {
    return {
        id: body.title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 30),
        title: body.title,
        platform: normalizeStudioPlatform(body.platform),
        genre: body.genre,
        status: "outlining",
        targetChapters: body.targetChapters ?? 200,
        chapterWordCount: body.chapterWordCount ?? 3000,
        ...(body.language === "en"
            ? { language: "en" }
            : body.language === "zh"
                ? { language: "zh" }
                : {}),
        createdAt: now,
        updatedAt: now,
    };
}
function defaultWait(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}
export async function waitForStudioBookReady(bookId, options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const wait = options.wait ?? defaultWait;
    const maxAttempts = options.maxAttempts ?? 5;
    const retryDelayMs = options.retryDelayMs ?? 150;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const response = await fetchImpl(`/api/books/${encodeURIComponent(bookId)}`);
        if (response.ok) {
            return await response.json();
        }
        if (attempt < maxAttempts && response.status === 404) {
            await wait(retryDelayMs);
            continue;
        }
        break;
    }
    throw new Error(`Book "${bookId}" was not ready after ${maxAttempts} attempts.`);
}
//# sourceMappingURL=book-create.js.map