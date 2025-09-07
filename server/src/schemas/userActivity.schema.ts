import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserActivity extends Document {
  organizationId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  event: string;
  weight: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: { type: String, required: true, index: true },
  weight: { type: Number, required: true, min: 0, default: 1 },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

// Indexes to support common queries/aggregations
// 1) Top users pipeline: match by organizationId and createdAt range
UserActivitySchema.index({ organizationId: 1, createdAt: -1 });
// 2) Per-user timelines and secondary filters
UserActivitySchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export const UserActivityModel: Model<IUserActivity> =
  mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);


