import mongoose, { Schema } from 'mongoose';

export interface IActionThreshold {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  name: string;
  description: string;
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';
  conditions: {
    field: string; // 'priority', 'satisfaction_rating', 'ticket_age_hours', 'customer_tier', 'issue_type'
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
    value: any;
  }[];
  threshold: number; // Confidence score threshold (0-1)
  isActive: boolean;
  priority: number; // Higher priority thresholds are checked first
  maxDailyActions?: number; // Limit actions per day
  actionConfig: {
    refundAmount?: number;
    couponCode?: string;
    couponDiscount?: number;
    autoReplyTemplate?: string;
    escalationLevel?: string;
    newPriority?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActionThresholdSchema: Schema = new Schema<IActionThreshold>({
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  actionType: { 
    type: String, 
    enum: ['refund', 'coupon', 'auto_resolve', 'escalate', 'priority_change', 'auto_reply'],
    required: true 
  },
  conditions: [{
    field: { 
      type: String, 
      required: true 
    },
    operator: { 
      type: String, 
      enum: ['equals', 'greater_than', 'less_than', 'contains', 'in'],
      required: true 
    },
    value: { 
      type: Schema.Types.Mixed, 
      required: true 
    }
  }],
  threshold: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 1 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  priority: { 
    type: Number, 
    default: 0 
  },
  maxDailyActions: { 
    type: Number 
  },
  actionConfig: {
    refundAmount: { 
      type: Number 
    },
    couponCode: { 
      type: String 
    },
    couponDiscount: { 
      type: Number 
    },
    autoReplyTemplate: { 
      type: String 
    },
    escalationLevel: { 
      type: String 
    },
    newPriority: { 
      type: String 
    }
  }
}, {
  timestamps: true,
  collection: 'action_thresholds'
});

// Index for efficient querying
ActionThresholdSchema.index({ organization: 1, isActive: 1, priority: -1 });

export const ActionThresholdModel = mongoose.model<IActionThreshold>('ActionThreshold', ActionThresholdSchema); 