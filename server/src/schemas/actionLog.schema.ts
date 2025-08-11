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
    
    // Customer Feedback and Business Impact
    customerResponse?: 'positive' | 'negative' | 'neutral'; // Customer reaction
    followUpRequired?: boolean;                              // Did action work?
    rollbackReason?: string;                                // Why was it reverted?
    businessImpact?: {                                      // Financial impact
      estimatedSavings: number;
      customerRetention: boolean;
      escalationPrevented: boolean;
      timeToResolution: number; // minutes
    };
    automationLevel?: 'fully_automated' | 'human_assisted' | 'manual_override';
    
    // Additional Performance Tracking
    customerSatisfactionBefore?: number;  // 1-5 rating before action
    customerSatisfactionAfter?: number;   // 1-5 rating after action
    resolutionEffectiveness?: number;     // 0-1 score of how well action worked
    subsequentActions?: string[];         // Any follow-up actions needed
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
    },
    
    // Customer Feedback and Business Impact
    customerResponse: { 
      type: String, 
      enum: ['positive', 'negative', 'neutral'] 
    },
    followUpRequired: { 
      type: Boolean, 
      default: false 
    },
    rollbackReason: { 
      type: String 
    },
    businessImpact: {
      estimatedSavings: { type: Number, default: 0 },
      customerRetention: { type: Boolean, default: false },
      escalationPrevented: { type: Boolean, default: false },
      timeToResolution: { type: Number, default: 0 } // minutes
    },
    automationLevel: { 
      type: String, 
      enum: ['fully_automated', 'human_assisted', 'manual_override'],
      default: 'fully_automated'
    },
    
    // Additional Performance Tracking
    customerSatisfactionBefore: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    customerSatisfactionAfter: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    resolutionEffectiveness: { 
      type: Number, 
      min: 0, 
      max: 1 
    },
    subsequentActions: [{ 
      type: String 
    }]
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