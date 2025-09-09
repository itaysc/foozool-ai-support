import mongoose from 'mongoose';
import { CustomerActivityModel } from '../../schemas/customerActivity.schema';

export interface CreateActivityInput {
  organizationId: string | mongoose.Types.ObjectId;
  customerId: string | mongoose.Types.ObjectId;
  solutionName: string;
  metricType: 'count' | 'amount' | 'percentage' | 'duration' | 'custom';
  metricValue: number;
  unit?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  activityDate?: string | Date;
}

export async function createActivity(input: CreateActivityInput) {
  const doc = await CustomerActivityModel.create({
    ...input,
    organizationId: new mongoose.Types.ObjectId(String(input.organizationId)),
    customerId: new mongoose.Types.ObjectId(String(input.customerId)),
    periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
    periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
    activityDate: input.activityDate ? new Date(input.activityDate) : undefined,
  });
  return doc.toObject();
}

export async function listActivities(params: { organizationId: string; customerId?: string }) {
  const query: any = { organizationId: params.organizationId };
  if (params.customerId) {
    query.customerId = params.customerId;
  }
  const items = await CustomerActivityModel.find(query).sort({ createdAt: -1 }).lean();
  return items;
}

export async function deleteActivity(activityId: string, organizationId: string) {
  const result = await CustomerActivityModel.findOneAndDelete({
    _id: activityId,
    organizationId: organizationId
  });
  if (!result) {
    throw new Error('Activity not found or access denied');
  }
  return result.toObject();
}


