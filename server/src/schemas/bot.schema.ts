import mongoose, { Schema } from 'mongoose';
import { IBot } from '../types/bot';

const BotSchema: Schema = new Schema<IBot>({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['customer_success', 'issue_insights', 'predictions', 'nps'], required: true, index: true },
  createdByUserId: { type: String, required: true, index: true },
}, { timestamps: true });

BotSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const BotModel = mongoose.model<IBot>('Bot', BotSchema);


