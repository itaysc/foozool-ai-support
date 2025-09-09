import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISolution extends Document {
  name: string;
  organizationId: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const SolutionSchema = new Schema<ISolution>(
  {
    name: { type: String, required: true, trim: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  },
  { timestamps: true }
);

SolutionSchema.index({ name: 1, organizationId: 1 }, { unique: true });

export const SolutionModel: Model<ISolution> =
  mongoose.models.Solution || mongoose.model<ISolution>('Solution', SolutionSchema);

