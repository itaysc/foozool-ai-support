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
  content?: string; // Optional for folders and link documents
  documentType: 'meeting_summary' | 'note' | 'report' | 'other' | 'link' | 'google_doc';
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
  
  // Link document fields
  linkUrl?: string; // For link documents
  linkDescription?: string; // Description of the linked content
  
  // Google Doc fields
  googleDocId?: string; // Google Drive document ID
  googleDocUrl?: string; // Direct link to Google Doc
  
  // Folder structure fields
  folderPath: string;        // e.g., "/Customer Meetings/Q4 2024/"
  parentFolderId?: mongoose.Types.ObjectId | string; // For easier queries
  isFolder: boolean;         // true for folders, false for documents
  folderName?: string;       // Only for folders
  
  // Metadata for folders
  childrenCount?: number;    // Number of items in folder
  lastModified?: Date;       // When folder contents were last modified
  
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
    required: function() {
      return !this.isFolder; // Content is only required for documents, not folders
    }
  },
  documentType: { 
    type: String, 
    enum: ['meeting_summary', 'note', 'report', 'other', 'link', 'google_doc'],
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
  },
  
  // Link document fields
  linkUrl: { 
    type: String   // For link documents
  },
  linkDescription: { 
    type: String   // Description of the linked content
  },
  
  // Google Doc fields
  googleDocId: { 
    type: String   // Google Drive document ID
  },
  googleDocUrl: { 
    type: String   // Direct link to Google Doc
  },
  
  // Folder structure fields
  folderPath: { 
    type: String, 
    default: '/'  // Root folder
  },
  parentFolderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Document'  // Self-reference for folders
  },
  isFolder: { 
    type: Boolean, 
    default: false
  },
  folderName: { 
    type: String   // Only populated for folders
  },
  
  // Folder metadata (only for folders)
  childrenCount: { 
    type: Number, 
    default: 0 
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  collection: 'documents'
});

DocumentSchema.index({ organizationId: 1, parentFolderId: 1, isFolder: -1, title: 1 }); // Main folder contents query with sort
DocumentSchema.index({ organizationId: 1, isFolder: 1, createdAt: -1 }); // Documents vs folders with creation date sort
DocumentSchema.index({ organizationId: 1, folderPath: 1 }); // Find folder by path
DocumentSchema.index({ _id: 1, organizationId: 1 }); // Get by ID with org check
DocumentSchema.index({ organizationId: 1, createdAt: -1 }); // General document listing
DocumentSchema.index({ customerId: 1, createdAt: -1 }); // Customer-specific documents
DocumentSchema.index({ 'actionItems.assignee': 1, 'actionItems.status': 1 }); // Action items

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

