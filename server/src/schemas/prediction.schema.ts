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
  longResolutionPredicted?: boolean; // Flag indicating if long resolution was predicted
  predictionConfidence?: number; // Confidence score for the long resolution prediction
  actualOutcome?: {
    finalStatus: string;
    isEscalated: boolean;
    csatScore?: number;
    resolvedAt: Date;
    resolutionTimeMs?: number; // Time to resolution in milliseconds
    accuracyEscalation?: boolean; // Was escalation prediction correct?
    accuracyCSAT?: boolean; // Was CSAT prediction correct?
    checkedAt: Date;
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
  longResolutionPredicted: { type: Boolean },
  predictionConfidence: { type: Number, min: 0, max: 1 },
  actualOutcome: {
    finalStatus: { type: String },
    isEscalated: { type: Boolean },
    csatScore: { type: Number, min: 1, max: 5 },
    resolvedAt: { type: Date },
    resolutionTimeMs: { type: Number },
    accuracyEscalation: { type: Boolean },
    accuracyCSAT: { type: Boolean },
    checkedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient queries
PredictionSchema.index({ organizationId: 1, createdAt: -1 });

export const PredictionModel = mongoose.model<IPrediction>('Prediction', PredictionSchema);