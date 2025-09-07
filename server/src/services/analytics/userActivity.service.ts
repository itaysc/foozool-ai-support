import mongoose, { PipelineStage } from 'mongoose';
import { UserActivityModel } from '../../schemas/userActivity.schema';
import { UserModel } from '../../schemas';
import { keyBy } from 'lodash';

export class UserActivityService {
  static async logEvent(params: {
    organizationId: string;
    userId: string;
    event: string;
    weight?: number;
    metadata?: Record<string, unknown>;
  }) {
    const { organizationId, userId, event, weight = 1, metadata } = params;
    await UserActivityModel.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      userId: new mongoose.Types.ObjectId(userId),
      event,
      weight,
      metadata
    });
    return { success: true };
  }

  static async getTopUsers(params: {
    organizationId: string;
    days?: number;
    limit?: number;
  }) {
    const { organizationId, days = 30, limit = 10 } = params;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const pipeline: PipelineStage[] = [
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), createdAt: { $gte: since } } },
      { $group: { _id: '$userId', score: { $sum: '$weight' }, events: { $sum: 1 }, lastActivity: { $max: '$createdAt' } } },
      { $sort: { score: -1, events: -1 } },
      { $limit: limit },
      { $project: { _id: 0, userId: '$_id', score: 1, events: 1, lastActivity: 1 } }
    ];
    // Prefetch org users and map by id (avoids $lookup on large collections)
    const users = await UserModel.find({ organization: new mongoose.Types.ObjectId(organizationId) })
      .select({ _id: 1, fullName: 1, email: 1 })
      .lean();
    const userMap = keyBy(users.map(u => ({ id: String((u as any)._id), fullName: (u as any).fullName, email: (u as any).email })), 'id');

    const results = await UserActivityModel.aggregate(pipeline);
    return results.map(r => ({
      ...r,
      name: userMap[String(r.userId)]?.fullName || 'Unknown',
      email: userMap[String(r.userId)]?.email || undefined
    }));
  }
}


