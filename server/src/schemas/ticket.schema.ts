// src/schemas/UniversalSchema.ts
import { ITicket, IBotProcessingStep } from '../types';
import mongoose, { Schema } from 'mongoose';

// Sub-schema for bot processing steps
const BotProcessingStepSchema = new Schema<IBotProcessingStep>({
  step: { type: String, required: true },
  completedAt: { type: Date, required: true },
  success: { type: Boolean, required: true },
  processingTime: { type: Number, required: true },
  errorMessage: { type: String }
}, { _id: false });

const TicketSchema: Schema = new Schema<ITicket>({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  externalId: { type: String, required: true },
  status: { type: String },
  channel: { type: String },
  satisfactionRating: { type: Number },
  tags: { type: [String] },
  comments: { type: [String] },
  chatHistory: { type: [String] },
  
  // Bot Performance Tracking Fields
  botProcessed: { type: Boolean, default: false },
  botResponseGenerated: { type: Boolean, default: false },
  botResponseTime: { type: Number }, // milliseconds
  botConfidenceScore: { type: Number, min: 0, max: 1 },
  botActions: { type: [String], default: [] },
  escalatedToHuman: { type: Boolean, default: false },
  escalationReason: { type: String },
  resolutionSource: { 
    type: String, 
    enum: ['bot', 'human', 'hybrid'],
    default: 'human'
  },
  customerFeedbackOnBot: { type: Number, min: 1, max: 5 },
  similarTicketsUsed: { type: Number, default: 0 },
  processingSteps: [BotProcessingStepSchema],
  
  // Additional bot metadata
  botModelVersion: { type: String },
  botPromptTemplate: { type: String },
  botResponseContent: { type: String },
  humanTakeoverAt: { type: Date },
  botAccuracyScore: { type: Number, min: 0, max: 1 }
}, {
  timestamps: true,
  collection: 'tickets'
});

// Add indexes for bot performance queries
TicketSchema.index({ organization: 1, botProcessed: 1 });
TicketSchema.index({ organization: 1, resolutionSource: 1 });
TicketSchema.index({ organization: 1, botProcessed: 1, createdAt: -1 });
TicketSchema.index({ organization: 1, escalatedToHuman: 1 });

export const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);
