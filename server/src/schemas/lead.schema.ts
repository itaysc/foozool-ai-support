import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  company?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
    index: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'closed'],
    default: 'new'
  },
  source: {
    type: String,
    default: 'landing-page'
  }
}, {
  timestamps: true
});

// Index for email to ensure uniqueness
LeadSchema.index({ email: 1 });

// Index for status for filtering
LeadSchema.index({ status: 1 });

// Index for createdAt for sorting
LeadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
