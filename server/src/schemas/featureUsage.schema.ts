import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeatureUsage extends Document {
  organizationId: mongoose.Types.ObjectId | string;
  featureId: mongoose.Types.ObjectId | string;
  featureName: string;
  customerId?: mongoose.Types.ObjectId | string;
  activeUsersCount?: number;
  utilizationPercent?: number;
  usageDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureUsageSchema = new Schema<IFeatureUsage>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    featureId: { type: Schema.Types.ObjectId, ref: 'Feature', required: true },
    featureName: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    activeUsersCount: { type: Number, min: 0 },
    utilizationPercent: { type: Number, min: 0, max: 100 },
    usageDate: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

FeatureUsageSchema.index({ organizationId: 1 });
FeatureUsageSchema.index({ organizationId: 1, featureId: 1 });

export const FeatureUsageModel: Model<IFeatureUsage> =
  mongoose.models.FeatureUsage || mongoose.model<IFeatureUsage>('FeatureUsage', FeatureUsageSchema);


