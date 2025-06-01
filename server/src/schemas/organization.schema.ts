import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { IOrganization } from '@common/types';

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
  url: String,
  contact: {
    name: String,
    email: String,
    phone: String,
    notes: String,
  },
}, {
  timestamps: true,
});

OrganizationSchema.pre('save', async function(next) {
  if (!this.signature) {
      this.signature = crypto.randomBytes(32).toString('hex');
      next();
  }
  next();
});
export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);


