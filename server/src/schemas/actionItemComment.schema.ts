import mongoose, { Schema, Document } from 'mongoose';

export interface IActionItemComment extends Document {
  title?: string;
  description: string;
  actionItem: mongoose.Types.ObjectId;
  taggedUsers: mongoose.Types.ObjectId[];
  index: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemCommentSchema = new Schema<IActionItemComment>({
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
  actionItem: {
    type: Schema.Types.ObjectId,
    ref: 'ActionItem',
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
ActionItemCommentSchema.index({ actionItem: 1, index: 1 });

export const ActionItemCommentModel = mongoose.model<IActionItemComment>('ActionItemComment', ActionItemCommentSchema);

