import mongoose, { Schema } from 'mongoose';

export interface IThresholdMiss {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';
  thresholdId: mongoose.Types.ObjectId;
  thresholdName: string;
  thresholdValue: number;
  confidenceScore: number;
  missedBy: number; // How much the confidence score missed the threshold
  ticketSubject?: string;
  ticketStatus?: string;
  ticketPriority?: string;
  customerTier?: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ThresholdMissSchema: Schema = new Schema<IThresholdMiss>({
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true,
  },
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true,
    index: true,
  },
  actionType: { 
    type: String, 
    enum: ['refund', 'coupon', 'auto_resolve', 'escalate', 'priority_change', 'auto_reply'],
    required: true,
    index: true,
  },
  thresholdId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ActionThreshold', 
    required: true,
    index: true,
  },
  thresholdName: { 
    type: String, 
    required: true 
  },
  thresholdValue: { 
    type: Number, 
    required: true 
  },
  confidenceScore: { 
    type: Number, 
    required: true 
  },
  missedBy: { 
    type: Number, 
    required: true 
  },
  ticketSubject: { 
    type: String 
  },
  ticketStatus: { 
    type: String 
  },
  ticketPriority: { 
    type: String 
  },
  customerTier: { 
    type: String 
  },
  occurredAt: { 
    type: Date, 
    default: Date.now,
    index: true,
  }
}, {
  timestamps: true,
  collection: 'threshold_misses'
});

// Indexes for efficient querying
ThresholdMissSchema.index({ organization: 1, actionType: 1, occurredAt: -1 });
ThresholdMissSchema.index({ organization: 1, occurredAt: -1 });
ThresholdMissSchema.index({ actionType: 1, occurredAt: -1 });

export const ThresholdMissModel = mongoose.model<IThresholdMiss>('ThresholdMiss', ThresholdMissSchema);
