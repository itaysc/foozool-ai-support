import mongoose, { Document, Schema } from 'mongoose';
import { IInsight } from './insights.schema';

export interface IActionItem extends Document {
  insightId?: mongoose.Types.ObjectId | IInsight | string;
  organizationId: mongoose.Types.ObjectId | string;
  customerId?: mongoose.Types.ObjectId | string;
  
  // Action Item Details
  title: string;
  description: string;
  
  // Task Management Fields (independent of insight)
  assignee?: mongoose.Types.ObjectId | string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // P0 is highest priority
  
  // Due date and timing
  dueDate?: Date;
  
  // Tracking
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  
  // Completion tracking
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId | string;
  
  // Additional metadata
  tags?: string[];
  metadata?: Record<string, unknown>;
  uniquenessKey?: string;
}

const ActionItemSchema: Schema = new Schema({
  insightId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Insight', 
    required: false,
    index: true 
  },
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  customerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: false,
    index: true 
  },
  
  // Action Item Details
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  
  // Jira-like Features
  assignee: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'resolved', 'closed', 'reopened'], 
    default: 'new',
    required: true,
    index: true
  },
  severity: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'],
    default: 'P2',
    index: true
  },
  
  // Due date and timing
  dueDate: { 
    type: Date,
    index: true
  },
  
  // Tracking
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Completion tracking
  completedAt: { 
    type: Date 
  },
  completedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Additional metadata
  tags: [{ type: String }],
  metadata: { type: Schema.Types.Mixed },
  uniquenessKey: {
    type: String,
    required: false,
    index: true
  }
});

// Update the updatedAt field before saving
ActionItemSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Indexes for better query performance
// Using sparse index for insightId since it's optional
ActionItemSchema.index({ insightId: 1, status: 1 }, { sparse: true });
ActionItemSchema.index({ organizationId: 1, status: 1 });
ActionItemSchema.index({ organizationId: 1, assignee: 1, status: 1 });
ActionItemSchema.index({ organizationId: 1, customerId: 1, status: 1 }, { sparse: true });
ActionItemSchema.index({ organizationId: 1, priority: -1, createdAt: -1 });
ActionItemSchema.index({ organizationId: 1, dueDate: 1 });
ActionItemSchema.index({ severity: 1, status: 1 });
// Sparse index for customerId since it's optional
ActionItemSchema.index({ customerId: 1, status: 1 }, { sparse: true });
ActionItemSchema.index(
  { insightId: 1, uniquenessKey: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { uniquenessKey: { $exists: true } }
  }
);

export const ActionItemModel = mongoose.model<IActionItem>('ActionItem', ActionItemSchema);
