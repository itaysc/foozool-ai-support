import mongoose, { Schema, Document } from 'mongoose';

export interface IInsightComment extends Document {
  title?: string;
  description: string;
  insight: mongoose.Types.ObjectId;
  insightNumber: string;
  taggedUsers: mongoose.Types.ObjectId[];
  index: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InsightCommentSchema = new Schema<IInsightComment>({
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
    default: ''
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  insight: {
    type: Schema.Types.ObjectId,
    ref: 'Insight',
    required: true,
    index: true
  },
  insightNumber: {
    type: String,
    required: true,
    index: true
  },
  taggedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }],
  index: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
InsightCommentSchema.index({ insight: 1, index: 1 });
InsightCommentSchema.index({ insightNumber: 1, index: 1 });

export const InsightCommentModel = mongoose.model<IInsightComment>('InsightComment', InsightCommentSchema);
