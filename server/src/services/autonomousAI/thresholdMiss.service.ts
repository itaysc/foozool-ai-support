import { ThresholdMissModel } from '../../schemas';
import { Types } from 'mongoose';

export interface ThresholdMissStats {
  actionType: string;
  thresholdName: string;
  missCount: number;
  averageMissBy: number;
  totalThresholds: number;
  missRate: number; // Percentage of times threshold was missed
}

export interface ThresholdMissSummary {
  totalMisses: number;
  actionTypeBreakdown: {
    [actionType: string]: number;
  };
  thresholdBreakdown: {
    [thresholdName: string]: number;
  };
  timeRangeStats: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

export class ThresholdMissService {
  /**
   * Get threshold miss statistics for a specific time range
   */
  static async getThresholdMissStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ThresholdMissStats[]> {
    try {
      const stats = await ThresholdMissModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            occurredAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              actionType: '$actionType',
              thresholdName: '$thresholdName'
            },
            missCount: { $sum: 1 },
            averageMissBy: { $avg: '$missedBy' },
            totalThresholds: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            actionType: '$_id.actionType',
            thresholdName: '$_id.thresholdName',
            missCount: 1,
            averageMissBy: { $round: ['$averageMissBy', 3] },
            totalThresholds: 1,
            missRate: { $multiply: [{ $divide: ['$missCount', '$totalThresholds'] }, 100] }
          }
        },
        {
          $sort: { missCount: -1 }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting threshold miss stats:', error);
      return [];
    }
  }

  /**
   * Get threshold miss summary for an organization
   */
  static async getThresholdMissSummary(organizationId: string): Promise<ThresholdMissSummary> {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Get total misses
      const totalMisses = await ThresholdMissModel.countDocuments({
        organization: new Types.ObjectId(organizationId)
      });

      // Get action type breakdown
      const actionTypeBreakdown = await ThresholdMissModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId)
          }
        },
        {
          $group: {
            _id: '$actionType',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get threshold breakdown
      const thresholdBreakdown = await ThresholdMissModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId)
          }
        },
        {
          $group: {
            _id: '$thresholdName',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get time range stats
      const last7DaysCount = await ThresholdMissModel.countDocuments({
        organization: new Types.ObjectId(organizationId),
        occurredAt: { $gte: last7Days }
      });

      const last30DaysCount = await ThresholdMissModel.countDocuments({
        organization: new Types.ObjectId(organizationId),
        occurredAt: { $gte: last30Days }
      });

      const last90DaysCount = await ThresholdMissModel.countDocuments({
        organization: new Types.ObjectId(organizationId),
        occurredAt: { $gte: last90Days }
      });

      return {
        totalMisses,
        actionTypeBreakdown: actionTypeBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as { [key: string]: number }),
        thresholdBreakdown: thresholdBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as { [key: string]: number }),
        timeRangeStats: {
          last7Days: last7DaysCount,
          last30Days: last30DaysCount,
          last90Days: last90DaysCount
        }
      };
    } catch (error) {
      console.error('Error getting threshold miss summary:', error);
      return {
        totalMisses: 0,
        actionTypeBreakdown: {},
        thresholdBreakdown: {},
        timeRangeStats: {
          last7Days: 0,
          last30Days: 0,
          last90Days: 0
        }
      };
    }
  }

  /**
   * Get detailed threshold misses for a specific time range
   */
  static async getThresholdMisses(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    skip: number = 0
  ) {
    try {
      const misses = await ThresholdMissModel.find({
        organization: new Types.ObjectId(organizationId),
        occurredAt: { $gte: startDate, $lte: endDate }
      })
      .sort({ occurredAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

      const total = await ThresholdMissModel.countDocuments({
        organization: new Types.ObjectId(organizationId),
        occurredAt: { $gte: startDate, $lte: endDate }
      });

      return {
        misses,
        total,
        hasMore: total > skip + limit
      };
    } catch (error) {
      console.error('Error getting threshold misses:', error);
      return {
        misses: [],
        total: 0,
        hasMore: false
      };
    }
  }
}
