import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { IOrganization } from 'src/types';

// Dashboard settings schema removed with insights functionality

const OrganizationSchema: Schema = new Schema<IOrganization>({
  name: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  signature: { type: String, unique: true, required: true, index: true },
  details: String,
  externalId: String,
  notes: [String],
  tags: [String],
  country: String,
  regions: [String],
  url: String,
  contact: {
    name: String,
    email: String,
    phone: String,
    notes: String,
  },
  // dashboardSettings removed with insights functionality
}, {
  timestamps: true,
});

// Additional indexes for better query performance
OrganizationSchema.index({ createdAt: -1 }); // For chronological ordering
OrganizationSchema.index({ updatedAt: -1 }); // For recent updates
OrganizationSchema.index({ externalId: 1 }); // For external system lookups
OrganizationSchema.index({ tags: 1 }); // For tag-based filtering

OrganizationSchema.pre('save', async function(next) {
  if (!this.signature) {
      this.signature = crypto.randomBytes(32).toString('hex');
      next();
  }
  next();
});

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);


