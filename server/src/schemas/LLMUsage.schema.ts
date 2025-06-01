import mongoose, { Schema } from 'mongoose';
import { ILLMUsage } from '@common/types';

export const llmUsageSchema = new Schema<ILLMUsage>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tokensPerCycle: {
        type: Number,
        required: true,
    },
    currentCycle: {
        promptTokens: Number,
        completionTokens: Number,
        totalTokens: Number,
        cachedTokens: Number,
    },
    totalPromptTokens: Number,
    totalCompletionTokens: Number,
    totalTokens: Number,
    totalCachedTokens: Number,
}, {
    timestamps: true
});

llmUsageSchema.index({ user: 1 }, { unique: true });

export const LLMUsageModel = mongoose.model<ILLMUsage>('LLMUsage', llmUsageSchema);
export function getLLMUsageModel(dbConnection) {
    return dbConnection.model('LLMUsage', llmUsageSchema);
}