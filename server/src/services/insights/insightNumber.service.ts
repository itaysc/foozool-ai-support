import mongoose from 'mongoose';
import { InsightModel } from '../../schemas/insights.schema';
import { CounterModel } from '../../schemas/counter.schema';

/**
 * Assigns a unique sequential insightNumber (IN******) to the given insight document.
 * Uses a MongoDB transaction to ensure the counter increment and document update are atomic.
 * The update only sets the number if it is not already set, so repeated calls are idempotent.
 */
export async function assignInsightNumberAtomic(insightId: mongoose.Types.ObjectId): Promise<string | undefined> {
  // Fallback helper when transactions are not supported (standalone Mongo)
  const assignWithoutTx = async (): Promise<string | undefined> => {
    // Check existing first using indexed _id
    const existing = await InsightModel.findOne({ _id: insightId }).select({ insightNumber: 1 }).lean();
    if ((existing as any)?.insightNumber) return (existing as any).insightNumber;
    // Atomic counter increment by indexed key only
    const doc = await CounterModel.findOneAndUpdate(
      { key: 'insightNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select({ seq: 1 }).lean();
    const seq = (doc as any)?.seq || 1;
    const next = `IN${String(seq).padStart(6, '0')}`;
    // Best-effort set-if-not-exists
    await InsightModel.updateOne(
      { _id: insightId, insightNumber: { $exists: false } },
      { $set: { insightNumber: next } }
    );
    return next;
  };

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    let assigned: string | undefined;
    await session.withTransaction(async () => {
      const existing = await InsightModel.findOne({ _id: insightId }).select({ insightNumber: 1 }).session(session!).lean();
      if ((existing as any)?.insightNumber) {
        assigned = (existing as any).insightNumber;
        return;
      }
      const doc = await CounterModel.findOneAndUpdate(
        { key: 'insightNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session: session!, setDefaultsOnInsert: true }
      ).select({ seq: 1 }).lean();
      const seq = (doc as any)?.seq || 1;
      const next = `IN${String(seq).padStart(6, '0')}`;
      await InsightModel.updateOne(
        { _id: insightId, insightNumber: { $exists: false } },
        { $set: { insightNumber: next } },
        { session: session! }
      );
      assigned = next;
    }, { writeConcern: { w: 'majority' } });
    return assigned;
  } catch (err: any) {
    // If transactions are not supported (standalone), fall back to non-tx path
    if (err?.code === 20 || /Transaction numbers are only allowed/.test(String(err?.errmsg || err?.message))) {
      return await assignWithoutTx();
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
}


