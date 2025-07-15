import { ActionLogModel } from '../../schemas';
import { IActionLog, IActionLogInput, ActionType, ActionStatus, TriggerSource } from '../../types/autonomousAI';
import { Types } from 'mongoose';

interface DailyStats {
  _id: ActionType;
  statuses: Array<{
    status: ActionStatus;
    count: number;
    avgConfidence: number;
    avgProcessingTime: number;
  }>;
  totalCount: number;
}

interface SuccessRateStats {
  _id: ActionType;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  avgConfidence: number;
  successRate: number;
}

export class ActionLogService {
  /**
   * Create a new action log entry
   */
  static async createLog(logData: IActionLogInput): Promise<IActionLog> {
    try {
      const log = new ActionLogModel(logData);
      const savedLog = await log.save();
      return savedLog.toObject() as unknown as IActionLog;
    } catch (error) {
      console.error('Error creating action log:', error);
      throw new Error('Failed to create action log');
    }
  }

  /**
   * Get action logs for an organization
   */
  static async getLogsByOrganization(
    organizationId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId)
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching action logs:', error);
      throw new Error('Failed to fetch action logs');
    }
  }

  /**
   * Get action logs for a specific ticket
   */
  static async getLogsByTicket(
    ticketId: string, 
    limit: number = 20
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        ticketId: new Types.ObjectId(ticketId)
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching ticket action logs:', error);
      throw new Error('Failed to fetch ticket action logs');
    }
  }

  /**
   * Get action logs by action type
   */
  static async getLogsByActionType(
    organizationId: string,
    actionType: ActionType,
    limit: number = 50
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId),
        actionType
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching action logs by type:', error);
      throw new Error('Failed to fetch action logs by type');
    }
  }

  /**
   * Get action logs by status
   */
  static async getLogsByStatus(
    organizationId: string,
    status: ActionStatus,
    limit: number = 50
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId),
        status
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching action logs by status:', error);
      throw new Error('Failed to fetch action logs by status');
    }
  }

  /**
   * Update action log status
   */
  static async updateLogStatus(
    logId: string, 
    status: ActionStatus, 
    errorMessage?: string
  ): Promise<IActionLog | null> {
    try {
      const updateData: Record<string, unknown> = { 
        status, 
        updatedAt: new Date() 
      };
      
      if (errorMessage) {
        updateData['metadata.errorMessage'] = errorMessage;
      }

      const log = await ActionLogModel.findByIdAndUpdate(
        logId,
        updateData,
        { new: true }
      ).lean();
      return log as unknown as IActionLog | null;
    } catch (error) {
      console.error('Error updating action log status:', error);
      throw new Error('Failed to update action log status');
    }
  }

  /**
   * Get daily action statistics
   */
  static async getDailyStats(
    organizationId: string,
    date: Date
  ): Promise<DailyStats[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const stats = await ActionLogModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            executedAt: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: {
              actionType: '$actionType',
              status: '$status'
            },
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidenceScore' },
            avgProcessingTime: { $avg: '$metadata.processingTimeMs' }
          }
        },
        {
          $group: {
            _id: '$_id.actionType',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count',
                avgConfidence: '$avgConfidence',
                avgProcessingTime: '$avgProcessingTime'
              }
            },
            totalCount: { $sum: '$count' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      throw new Error('Failed to fetch daily statistics');
    }
  }

  /**
   * Get action success rate
   */
  static async getSuccessRate(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SuccessRateStats[]> {
    try {
      const stats = await ActionLogModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            executedAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$actionType',
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'executed'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            avgConfidence: { $avg: '$confidenceScore' }
          }
        },
        {
          $addFields: {
            successRate: {
              $multiply: [
                { $divide: ['$successful', '$total'] },
                100
              ]
            }
          }
        }
      ]);

      return stats as SuccessRateStats[];
    } catch (error) {
      console.error('Error fetching success rate:', error);
      throw new Error('Failed to fetch success rate');
    }
  }

  /**
   * Get action performance metrics
   */
  static async getPerformanceMetrics(
    organizationId: string,
    days: number = 30
  ): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await ActionLogModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId),
            executedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              actionType: '$actionType',
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$executedAt'
                }
              }
            },
            count: { $sum: 1 },
            avgProcessingTime: { $avg: '$metadata.processingTimeMs' },
            avgConfidence: { $avg: '$confidenceScore' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'executed'] }, 1, 0] }
            }
          }
        },
        {
          $group: {
            _id: '$_id.actionType',
            dailyStats: {
              $push: {
                date: '$_id.date',
                count: '$count',
                avgProcessingTime: '$avgProcessingTime',
                avgConfidence: '$avgConfidence',
                successCount: '$successCount'
              }
            },
            totalActions: { $sum: '$count' },
            avgProcessingTime: { $avg: '$avgProcessingTime' },
            avgConfidence: { $avg: '$avgConfidence' }
          }
        }
      ]);

      return metrics;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  /**
   * Get failed actions for review
   */
  static async getFailedActions(
    organizationId: string,
    limit: number = 20
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId),
        status: 'failed'
      })
      .sort({ executedAt: -1 })
      .limit(limit)
      .populate('ticketId', 'subject description')
      .populate('actionThresholdId', 'name description')
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching failed actions:', error);
      throw new Error('Failed to fetch failed actions');
    }
  }

  /**
   * Get high-confidence actions
   */
  static async getHighConfidenceActions(
    organizationId: string,
    confidenceThreshold: number = 0.8,
    limit: number = 20
  ): Promise<IActionLog[]> {
    try {
      const logs = await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId),
        confidenceScore: { $gte: confidenceThreshold },
        status: 'executed'
      })
      .sort({ confidenceScore: -1, executedAt: -1 })
      .limit(limit)
      .populate('ticketId', 'subject description')
      .populate('actionThresholdId', 'name description')
      .lean();
      return logs as unknown as IActionLog[];
    } catch (error) {
      console.error('Error fetching high-confidence actions:', error);
      throw new Error('Failed to fetch high-confidence actions');
    }
  }

  /**
   * Clean old action logs
   */
  static async cleanOldLogs(
    organizationId: string,
    daysToKeep: number = 90
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await ActionLogModel.deleteMany({
        organization: new Types.ObjectId(organizationId),
        executedAt: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      throw new Error('Failed to clean old action logs');
    }
  }

  /**
   * Export action logs for analysis
   */
  static async exportLogs(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      return await ActionLogModel.find({
        organization: new Types.ObjectId(organizationId),
        executedAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ executedAt: -1 })
      .populate('ticketId', 'subject description priority status')
      .populate('actionThresholdId', 'name description actionType')
      .lean();
    } catch (error) {
      console.error('Error exporting action logs:', error);
      throw new Error('Failed to export action logs');
    }
  }
} 