import mongoose, { Schema } from 'mongoose';

export interface ICustomerTier {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  name: string; // 'bronze', 'silver', 'gold', 'platinum'
  description: string;
  priority: number; // Higher number = higher tier
  autoActionPermissions: {
    refund: {
      enabled: boolean;
      maxAmount: number;
      maxDailyCount: number;
    };
    coupon: {
      enabled: boolean;
      maxDiscount: number;
      maxDailyCount: number;
    };
    autoResolve: {
      enabled: boolean;
      maxTicketAgeHours: number;
    };
    escalation: {
      enabled: boolean;
      maxEscalationLevel: string;
    };
    priorityChange: {
      enabled: boolean;
      allowedPriorities: string[];
    };
    autoReply: {
      enabled: boolean;
      maxDailyCount: number;
    };
  };
  satisfactionThresholds: {
    lowSatisfactionThreshold: number; // Below this triggers special handling
    highSatisfactionThreshold: number; // Above this allows more actions
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerTierSchema: Schema = new Schema<ICustomerTier>({
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
  priority: { 
    type: Number, 
    required: true 
  },
  autoActionPermissions: {
    refund: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      maxAmount: { 
        type: Number, 
        default: 0 
      },
      maxDailyCount: { 
        type: Number, 
        default: 0 
      }
    },
    coupon: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      maxDiscount: { 
        type: Number, 
        default: 0 
      },
      maxDailyCount: { 
        type: Number, 
        default: 0 
      }
    },
    autoResolve: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      maxTicketAgeHours: { 
        type: Number, 
        default: 0 
      }
    },
    escalation: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      maxEscalationLevel: { 
        type: String, 
        default: 'low' 
      }
    },
    priorityChange: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      allowedPriorities: { 
        type: [String], 
        default: [] 
      }
    },
    autoReply: {
      enabled: { 
        type: Boolean, 
        default: true 
      },
      maxDailyCount: { 
        type: Number, 
        default: 10 
      }
    }
  },
  satisfactionThresholds: {
    lowSatisfactionThreshold: { 
      type: Number, 
      default: 3 
    },
    highSatisfactionThreshold: { 
      type: Number, 
      default: 4 
    }
  }
}, {
  timestamps: true,
  collection: 'customer_tiers'
});

// Index for efficient querying
CustomerTierSchema.index({ organization: 1, priority: -1 });

export const CustomerTierModel = mongoose.model<ICustomerTier>('CustomerTier', CustomerTierSchema); 