import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIndustry extends Document {
  name: string;
  organizationId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const IndustrySchema = new Schema<IIndustry>(
  {
    name: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true, default: null },
  },
  { timestamps: true }
);

IndustrySchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const IndustryModel: Model<IIndustry> =
  mongoose.models.Industry || mongoose.model<IIndustry>('Industry', IndustrySchema);


