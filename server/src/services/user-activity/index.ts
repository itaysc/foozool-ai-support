import mongoose from 'mongoose';
import { UserActivityModel } from '../../schemas/userActivity.schema';

export interface CreateUserActivityInput {
  organizationId: string | mongoose.Types.ObjectId;
  customerId: string | mongoose.Types.ObjectId;
  userId: string;
  userRole?: string;
  solutionName: string;
  action: string;
  sessionId?: string;
  timestamp?: string | Date;
  metadata?: Record<string, any>;
}

export interface UserActivityFilters {
  organizationId: string;
  customerId?: string;
  userId?: string;
  solutionName?: string;
  action?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  userRole?: string;
}

export async function createUserActivity(input: CreateUserActivityInput) {
  const doc = await UserActivityModel.create({
    ...input,
    organizationId: new mongoose.Types.ObjectId(String(input.organizationId)),
    customerId: new mongoose.Types.ObjectId(String(input.customerId)),
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
  });
  return doc.toObject();
}

export async function listUserActivities(filters: UserActivityFilters) {
  const query: any = { organizationId: filters.organizationId };
  
  if (filters.customerId) {
    query.customerId = filters.customerId;
  }
  if (filters.userId) {
    query.userId = filters.userId;
  }
  if (filters.solutionName) {
    query.solutionName = filters.solutionName;
  }
  if (filters.action) {
    query.action = filters.action;
  }
  if (filters.userRole) {
    query.userRole = filters.userRole;
  }
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const items = await UserActivityModel.find(query)
    .sort({ timestamp: -1 })
    .lean();
  return items;
}

export async function getUserActivityStats(filters: UserActivityFilters) {
  const query: any = { organizationId: filters.organizationId };
  
  if (filters.customerId) {
    query.customerId = filters.customerId;
  }
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const stats = await UserActivityModel.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSolutions: { $addToSet: '$solutionName' },
        uniqueActions: { $addToSet: '$action' },
        avgActivitiesPerUser: { $avg: 1 }
      }
    },
    {
      $project: {
        totalActivities: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        uniqueSolutionCount: { $size: '$uniqueSolutions' },
        uniqueActionCount: { $size: '$uniqueActions' },
        avgActivitiesPerUser: 1
      }
    }
  ]);

  return stats[0] || {
    totalActivities: 0,
    uniqueUserCount: 0,
    uniqueSolutionCount: 0,
    uniqueActionCount: 0,
    avgActivitiesPerUser: 0
  };
}

export async function getUserEngagementMetrics(filters: UserActivityFilters) {
  const query: any = { organizationId: filters.organizationId };
  
  if (filters.customerId) {
    query.customerId = filters.customerId;
  }
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }

  const metrics = await UserActivityModel.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$userId',
        totalActivities: { $sum: 1 },
        uniqueSolutions: { $addToSet: '$solutionName' },
        uniqueActions: { $addToSet: '$action' },
        firstActivity: { $min: '$timestamp' },
        lastActivity: { $max: '$timestamp' },
        userRole: { $first: '$userRole' }
      }
    },
    {
      $project: {
        userId: '$_id',
        totalActivities: 1,
        solutionCount: { $size: '$uniqueSolutions' },
        actionCount: { $size: '$uniqueActions' },
        firstActivity: 1,
        lastActivity: 1,
        userRole: 1,
        engagementScore: {
          $add: [
            { $multiply: ['$totalActivities', 0.4] },
            { $multiply: [{ $size: '$uniqueSolutions' }, 0.3] },
            { $multiply: [{ $size: '$uniqueActions' }, 0.3] }
          ]
        }
      }
    },
    { $sort: { engagementScore: -1 } }
  ]);

  return metrics;
}

export async function deleteUserActivity(activityId: string, organizationId: string) {
  const result = await UserActivityModel.findOneAndDelete({
    _id: activityId,
    organizationId: organizationId
  });
  if (!result) {
    throw new Error('User activity not found or access denied');
  }
  return result.toObject();
}
