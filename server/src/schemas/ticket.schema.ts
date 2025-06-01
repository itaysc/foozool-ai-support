// src/schemas/UniversalSchema.ts
import { ITicket } from '@common/types';
import mongoose, { Schema } from 'mongoose';

const TicketSchema: Schema = new Schema<ITicket>({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  externalId: { type: String, required: true },
  createdAt: { type: String },
  updatedAt: { type: String },
  status: { type: String },
  channel: { type: String },
  satisfactionRating: { type: Number },
  tags: { type: [String] },
  comments: { type: [String] },
  chatHistory: { type: [String] },
}, {
  timestamps: true,
  collection: 'tickets'
});

export const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);
