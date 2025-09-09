import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomerActivity extends Document {
  organizationId: mongoose.Types.ObjectId | string;
  customerId: mongoose.Types.ObjectId | string;
  solutionName: string;
  metricType: 'count' | 'amount' | 'percentage' | 'duration' | 'custom';
  metricValue: number;
  unit?: string;
  periodStart?: Date;
  periodEnd?: Date;
  activityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerActivitySchema = new Schema<ICustomerActivity>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  solutionName: { type: String, required: true },
  metricType: { type: String, enum: ['count', 'amount', 'percentage', 'duration', 'custom'], required: true },
  metricValue: { type: Number, required: true },
  unit: { type: String },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  activityDate: { type: Date },
}, { timestamps: true });

CustomerActivitySchema.index({ organizationId: 1, customerId: 1, solutionName: 1 });
CustomerActivitySchema.index({ periodStart: 1, periodEnd: 1 });
CustomerActivitySchema.index({ activityDate: 1 });

export const CustomerActivityModel: Model<ICustomerActivity> =
  mongoose.models.CustomerActivity || mongoose.model<ICustomerActivity>('CustomerActivity', CustomerActivitySchema);


