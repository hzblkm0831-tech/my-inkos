export type ChatDepth = "light" | "normal" | "deep";
export interface ChatDepthProfile {
    readonly depth: ChatDepth;
    readonly temperature: number;
    readonly maxTokens?: number;
    readonly label: string;
}
export declare function resolveChatDepthProfile(depth: ChatDepth): ChatDepthProfile;
//# sourceMappingURL=chat-depth.d.ts.map