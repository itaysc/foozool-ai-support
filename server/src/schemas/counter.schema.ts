import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const CounterSchema: Schema = new Schema<ICounter>({
  key: { type: String, unique: true, index: true },
  seq: { type: Number, default: 0, index: true }
});

CounterSchema.index({ key: 1 }, { unique: true });

export const CounterModel = mongoose.models.__Counter || mongoose.model<ICounter>('__Counter', CounterSchema);

export async function getNextSequence(key: string): Promise<number> {
  // Only indexed filter on key
  const doc = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select({ seq: 1 }).lean<ICounter>();
  return (doc && (doc as any).seq) || 1;
}


