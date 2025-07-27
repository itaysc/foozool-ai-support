import mongoose, { Schema } from 'mongoose';

export interface IWebhook {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  url: string;
  secret: string; // For webhook signature verification
  events: string[]; // Array of event types to listen for
  isActive: boolean;
  retryCount: number;
  maxRetries: number;
  timeout: number; // Timeout in milliseconds
  headers?: Record<string, string>; // Custom headers to send
  lastTriggered?: Date;
  lastSuccess?: Date;
  lastFailure?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema: Schema = new Schema<IWebhook>({
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  url: { 
    type: String, 
    required: true 
  },
  secret: { 
    type: String, 
    required: true 
  },
  events: { 
    type: [String], 
    required: true,
    default: []
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  retryCount: { 
    type: Number, 
    default: 0 
  },
  maxRetries: { 
    type: Number, 
    default: 3 
  },
  timeout: { 
    type: Number, 
    default: 10000 // 10 seconds
  },
  headers: { 
    type: Schema.Types.Mixed 
  },
  lastTriggered: { 
    type: Date 
  },
  lastSuccess: { 
    type: Date 
  },
  lastFailure: { 
    type: Date 
  },
  failureCount: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true,
  collection: 'webhooks'
});

// Indexes for efficient querying
WebhookSchema.index({ organization: 1, isActive: 1 });
WebhookSchema.index({ organization: 1, events: 1 });
WebhookSchema.index({ organization: 1, isActive: 1, events: 1 });

export const WebhookModel = mongoose.model<IWebhook>('Webhook', WebhookSchema); 