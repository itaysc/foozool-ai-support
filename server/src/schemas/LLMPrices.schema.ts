import mongoose, { Schema } from 'mongoose';
import { ILLMPrices } from '@common/types';

export const llmPricesSchema = new Schema<ILLMPrices>({
    model: {
        type: String,
        required: true,
    },
    description: String,
    pricePerToken: {
        type: Number,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    isRecommended: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

llmPricesSchema.index({ model: 1 }, { unique: true });

export const LLMPricesModel = mongoose.model<ILLMPrices>('LLMPrices', llmPricesSchema);
export function getLLMPricesModel(dbConnection) {
    return dbConnection.model('LLMPrices', llmPricesSchema);
}