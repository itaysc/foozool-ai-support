import { ObjectId } from './index';

export interface ILLMUsage {
    user: ObjectId;
    tokensPerCycle: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCachedTokens: number;
    currentCycle: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens: number;
    };
}