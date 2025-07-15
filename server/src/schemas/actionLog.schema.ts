import mongoose, { Schema } from 'mongoose';

export interface IActionLog {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  actionThresholdId: mongoose.Types.ObjectId;
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';
  confidenceScore: number;
  executedAt: Date;
  status: 'pending' | 'executed' | 'failed' | 'reverted';
  details: {
    refundAmount?: number;
    couponCode?: string;
    couponDiscount?: number;
    autoReplyContent?: string;
    escalationLevel?: string;
    newPriority?: string;
    originalValue?: any;
    newValue?: any;
  };
  metadata: {
    triggeredBy: string; // 'ai_analysis', 'manual_trigger', 'scheduled'
    processingTimeMs: number;
    errorMessage?: string;
    externalSystemResponse?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActionLogSchema: Schema = new Schema<IActionLog>({
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true 
  },
  actionThresholdId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ActionThreshold', 
    required: true 
  },
  actionType: { 
    type: String, 
    enum: ['refund', 'coupon', 'auto_resolve', 'escalate', 'priority_change', 'auto_reply'],
    required: true 
  },
  confidenceScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 1 
  },
  executedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['pending', 'executed', 'failed', 'reverted'],
    default: 'pending' 
  },
  details: {
    refundAmount: { 
      type: Number 
    },
    couponCode: { 
      type: String 
    },
    couponDiscount: { 
      type: Number 
    },
    autoReplyContent: { 
      type: String 
    },
    escalationLevel: { 
      type: String 
    },
    newPriority: { 
      type: String 
    },
    originalValue: { 
      type: Schema.Types.Mixed 
    },
    newValue: { 
      type: Schema.Types.Mixed 
    }
  },
  metadata: {
    triggeredBy: { 
      type: String, 
      enum: ['ai_analysis', 'manual_trigger', 'scheduled'],
      default: 'ai_analysis' 
    },
    processingTimeMs: { 
      type: Number 
    },
    errorMessage: { 
      type: String 
    },
    externalSystemResponse: { 
      type: Schema.Types.Mixed 
    }
  }
}, {
  timestamps: true,
  collection: 'action_logs'
});

// Indexes for efficient querying
ActionLogSchema.index({ organization: 1, ticketId: 1, executedAt: -1 });
ActionLogSchema.index({ organization: 1, actionType: 1, status: 1 });
ActionLogSchema.index({ executedAt: -1 });

export const ActionLogModel = mongoose.model<IActionLog>('ActionLog', ActionLogSchema); 