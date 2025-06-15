import mongoose, { Schema } from "mongoose";

const tokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, required: true, enum: ['zendesk'] },
}, { timestamps: true });

export const TokenModel = mongoose.model('Token', tokenSchema);
