import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActionItem {
  text: string;
  assignee: mongoose.Types.ObjectId | string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  completedAt?: Date;
}

export interface IDocument extends Document {
  organizationId: mongoose.Types.ObjectId | string;
  customerId?: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  title: string;
  content: string;
  documentType: 'meeting_summary' | 'note' | 'report' | 'other';
  meetingDate?: Date;
  meetingType?: 'customer_facing' | 'internal' | 'check_in' | 'escalation' | 'onboarding' | 'renewal' | 'other';
  duration?: number;
  attendees: Array<mongoose.Types.ObjectId | string>;
  notes?: string;
  keyPoints?: string[];
  customerSatisfactionScore?: number;
  actionItems: IActionItem[];
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItem>({
  text: { 
    type: String, 
    required: true 
  },
  assignee: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dueDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high']
  },
  completedAt: { 
    type: Date 
  }
});

const DocumentSchema = new Schema<IDocument>({
  organizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  customerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Customer'
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  documentType: { 
    type: String, 
    enum: ['meeting_summary', 'note', 'report', 'other'],
    required: true,
    default: 'meeting_summary'
  },
  meetingDate: { 
    type: Date 
  },
  meetingType: { 
    type: String, 
    enum: ['customer_facing', 'internal', 'check_in', 'escalation', 'onboarding', 'renewal', 'other']
  },
  duration: { 
    type: Number 
  },
  attendees: [{ 
    type: Schema.Types.Mixed 
  }],
  notes: { 
    type: String 
  },
  keyPoints: [{ 
    type: String 
  }],
  customerSatisfactionScore: { 
    type: Number,
    min: 1,
    max: 10
  },
  actionItems: [ActionItemSchema],
  tags: [{ 
    type: String 
  }],
  sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative']
  }
}, { 
  timestamps: true,
  collection: 'documents'
});

// Indexes for efficient querying
DocumentSchema.index({ organizationId: 1, createdAt: -1 });
DocumentSchema.index({ customerId: 1, createdAt: -1 });
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ 'actionItems.assignee': 1, 'actionItems.status': 1 });
DocumentSchema.index({ createdBy: 1 });
DocumentSchema.index({ meetingType: 1 });

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

