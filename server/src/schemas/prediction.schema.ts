import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction extends Document {
  ticketId: string;
  organizationId: mongoose.Types.ObjectId;
  predictedEscalation: {
    risk: 'Low' | 'Medium' | 'High';
    confidence: number;
  };
  predictedCSAT: {
    risk: 'Low' | 'Medium' | 'High';
    confidence: number;
  };
  createdAt: Date;
}

const PredictionSchema: Schema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  predictedEscalation: {
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  predictedCSAT: {
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient queries
PredictionSchema.index({ organizationId: 1, createdAt: -1 });

export const PredictionModel = mongoose.model<IPrediction>('Prediction', PredictionSchema);