import mongoose, { Schema } from 'mongoose';
import { ICRM } from '../types/crm';

const CRMSchema: Schema = new Schema<ICRM>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  configSchema: {
    type: Schema.Types.Mixed,
    required: true,
  },
  webhookConfig: {
    supportedEvents: [String],
    payloadSchema: Schema.Types.Mixed,
    headersSchema: Schema.Types.Mixed,
  },
  apiConfig: {
    baseUrl: String,
    authenticationType: {
      type: String,
      enum: ['basic', 'bearer', 'oauth2', 'api_key'],
      required: true,
    },
    requiredHeaders: [String],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CRMSchema.index({ type: 1, isActive: 1 });
CRMSchema.index({ isActive: 1 });

export const CRMModel = mongoose.model<ICRM>('CRM', CRMSchema);
