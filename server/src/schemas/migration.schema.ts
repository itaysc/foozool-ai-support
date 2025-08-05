import mongoose, { Document, Schema } from 'mongoose';

export interface IMigration extends Document {
  name: string;
  description: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  initiatedBy: string;
  organization: mongoose.Types.ObjectId;
  totalRecords?: number;
  processedRecords?: number;
  errorMessages: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const migrationSchema = new Schema<IMigration>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  initiatedBy: {
    type: String,
    required: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  totalRecords: {
    type: Number
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  errorMessages: [{
    type: String
  }],
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
migrationSchema.index({ name: 1, organization: 1 });
migrationSchema.index({ status: 1 });
migrationSchema.index({ createdAt: -1 });

export const MigrationModel = mongoose.model<IMigration>('Migration', migrationSchema);

export default MigrationModel; 