import { Schema, model, Document } from 'mongoose';

export interface IProcessedStub extends Document {
    stubId: string;           // Unique identifier for the stub item
    stubType: string;         // 'stub2' or 'stub3'
    processedAt: Date;        // When it was processed
    status: 'success' | 'failed';
    error?: string;           // Error message if failed
    metadata: {
        subject?: string;     // For stub2
        description: string;  // The main content
        intent?: string;      // For stub3
    };
}

const processedStubSchema = new Schema<IProcessedStub>({
    stubId: { type: String, required: true, unique: true },
    stubType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['success', 'failed'], required: true },
    error: { type: String },
    metadata: {
        subject: { type: String },
        description: { type: String, required: true },
        intent: { type: String }
    }
});

// Compound index to quickly find unprocessed items
processedStubSchema.index({ stubType: 1, status: 1 });

export const ProcessedStubModel = model<IProcessedStub>('ProcessedStub', processedStubSchema); 