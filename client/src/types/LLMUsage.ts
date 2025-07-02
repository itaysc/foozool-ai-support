import mongoose from 'mongoose';

export interface ILLMUsage {
    user: mongoose.Types.ObjectId;
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