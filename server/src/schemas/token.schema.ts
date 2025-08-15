import mongoose, { Schema } from "mongoose";
import { IToken } from "src/types";

const tokenSchema = new Schema<IToken>({
  token: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: false },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true , index: true},
  type: { 
    type: String, 
    required: true,
  },
  description: String,
}, { timestamps: true });

export const TokenModel = mongoose.model<IToken>('Token', tokenSchema);
