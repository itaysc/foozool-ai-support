import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeature extends Document {
  name: string;
  organizationId: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema<IFeature>(
  {
    name: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  },
  { timestamps: true }
);

FeatureSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const FeatureModel: Model<IFeature> =
  mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema);


