import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserActivity extends Document {
  organizationId: mongoose.Types.ObjectId | string;
  customerId: mongoose.Types.ObjectId | string;
  userId: string;
  userRole?: string;
  solutionName: string;
  action: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  userId: { type: String, required: true },
  userRole: { type: String },
  solutionName: { type: String, required: true },
  action: { type: String, required: true },
  sessionId: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Indexes for efficient querying
UserActivitySchema.index({ organizationId: 1, customerId: 1, userId: 1 });
UserActivitySchema.index({ organizationId: 1, customerId: 1, solutionName: 1 });
UserActivitySchema.index({ organizationId: 1, customerId: 1, timestamp: -1 });
UserActivitySchema.index({ organizationId: 1, userId: 1, timestamp: -1 });
UserActivitySchema.index({ sessionId: 1 });

// Additional indexes for enhanced user engagement insights
UserActivitySchema.index({ organizationId: 1, customerId: 1, timestamp: -1, userId: 1 }); // For trend analysis
UserActivitySchema.index({ organizationId: 1, customerId: 1, solutionName: 1, timestamp: -1 }); // For feature discovery
UserActivitySchema.index({ organizationId: 1, customerId: 1, userRole: 1, timestamp: -1 }); // For role-based analysis
UserActivitySchema.index({ organizationId: 1, customerId: 1, sessionId: 1, timestamp: -1 }); // For session analysis

export const UserActivityModel: Model<IUserActivity> =
  mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);