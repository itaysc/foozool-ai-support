import mongoose, { Schema, Document } from 'mongoose';

export interface IUpload extends Document {
  uploadId: string;
  organizationId: mongoose.Types.ObjectId;
  type: 'csv' | 'json' | 'webhook' | 'generic';
  filename?: string;
  originalSize?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message: string;
  error?: string;
  metadata: {
    surveyId?: string;
    responsesCount?: number;
    processingTime?: number;
    batchSize?: number;
    memoryUsage?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date; // Auto-delete old uploads
}

const UploadSchema = new Schema<IUpload>({
  uploadId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['csv', 'json', 'webhook', 'generic'],
    required: true
  },
  filename: {
    type: String,
    required: false
  },
  originalSize: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  message: {
    type: String,
    default: 'Upload created'
  },
  error: {
    type: String,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true
  }
});

// Compound indexes for efficient querying
UploadSchema.index({ organizationId: 1, status: 1 });
UploadSchema.index({ organizationId: 1, createdAt: -1 });
UploadSchema.index({ organizationId: 1, type: 1 });

// Auto-update updatedAt field
UploadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Auto-delete expired uploads (older than 30 days)
UploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UploadModel = mongoose.model<IUpload>('Upload', UploadSchema);
