import { ActionThresholdModel } from '../../schemas';
import { IActionThreshold, IActionThresholdInput, ActionType, ICondition } from '../../types/autonomousAI';
import { Types } from 'mongoose';

interface TicketData {
  priority?: string;
  satisfactionRating?: number;
  ticketAgeHours?: number;
  customerTier?: string;
  status?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface ThresholdStats {
  _id: ActionType;
  count: number;
  activeCount: number;
  avgThreshold: number;
  avgPriority: number;
}

export class ActionThresholdService {
  /**
   * Create a new action threshold
   */
  static async createThreshold(thresholdData: IActionThresholdInput): Promise<IActionThreshold> {
    try {
      const threshold = new ActionThresholdModel(thresholdData);
      const savedThreshold = await threshold.save();
      return savedThreshold.toObject() as unknown as IActionThreshold;
    } catch (error) {
      console.error('Error creating action threshold:', error);
      throw new Error('Failed to create action threshold');
    }
  }

  /**
   * Get all thresholds for an organization
   */
  static async getThresholdsByOrganization(organizationId: string): Promise<IActionThreshold[]> {
    try {
      const thresholds = await ActionThresholdModel.find({
        organization: new Types.ObjectId(organizationId)
      }).sort({ priority: -1, createdAt: -1 }).lean();
      return thresholds as unknown as IActionThreshold[];
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      throw new Error('Failed to fetch action thresholds');
    }
  }

  /**
   * Get active thresholds for an organization
   */
  static async getActiveThresholds(organizationId: string): Promise<IActionThreshold[]> {
    try {
      const thresholds = await ActionThresholdModel.find({
        organization: new Types.ObjectId(organizationId),
        isActive: true
      }).sort({ priority: -1 }).lean();
      return thresholds as unknown as IActionThreshold[];
    } catch (error) {
      console.error('Error fetching active thresholds:', error);
      throw new Error('Failed to fetch active thresholds');
    }
  }

  /**
   * Get thresholds by action type
   */
  static async getThresholdsByActionType(
    organizationId: string, 
    actionType: ActionType
  ): Promise<IActionThreshold[]> {
    try {
      const thresholds = await ActionThresholdModel.find({
        organization: new Types.ObjectId(organizationId),
        actionType,
        isActive: true
      }).sort({ priority: -1 }).lean();
      return thresholds as unknown as IActionThreshold[];
    } catch (error) {
      console.error('Error fetching thresholds by action type:', error);
      throw new Error('Failed to fetch thresholds by action type');
    }
  }

  /**
   * Update an action threshold
   */
  static async updateThreshold(
    thresholdId: string, 
    updateData: Partial<IActionThreshold>
  ): Promise<IActionThreshold | null> {
    try {
      const threshold = await ActionThresholdModel.findByIdAndUpdate(
        thresholdId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).lean();
      return threshold as unknown as IActionThreshold | null;
    } catch (error) {
      console.error('Error updating threshold:', error);
      throw new Error('Failed to update action threshold');
    }
  }

  /**
   * Update threshold value specifically
   */
  static async updateThresholdValue(
    thresholdId: string, 
    newThreshold: number
  ): Promise<IActionThreshold | null> {
    try {
      // Validate threshold value
      if (typeof newThreshold !== 'number' || newThreshold < 0 || newThreshold > 1) {
        throw new Error('Invalid threshold value. Must be a number between 0 and 1.');
      }

      const threshold = await ActionThresholdModel.findByIdAndUpdate(
        thresholdId,
        { 
          threshold: newThreshold, 
          updatedAt: new Date() 
        },
        { new: true }
      ).lean();

      if (!threshold) {
        throw new Error('Threshold not found');
      }

      return threshold as unknown as IActionThreshold;
    } catch (error) {
      console.error('Error updating threshold value:', error);
      throw new Error('Failed to update threshold value');
    }
  }

  /**
   * Delete an action threshold
   */
  static async deleteThreshold(thresholdId: string): Promise<boolean> {
    try {
      const result = await ActionThresholdModel.findByIdAndDelete(thresholdId);
      return !!result;
    } catch (error) {
      console.error('Error deleting threshold:', error);
      throw new Error('Failed to delete action threshold');
    }
  }

  /**
   * Toggle threshold active status
   */
  static async toggleThresholdStatus(thresholdId: string): Promise<IActionThreshold | null> {
    try {
      const threshold = await ActionThresholdModel.findById(thresholdId);
      if (!threshold) {
        throw new Error('Threshold not found');
      }

      threshold.isActive = !threshold.isActive;
      threshold.updatedAt = new Date();
      const savedThreshold = await threshold.save();
      return savedThreshold.toObject() as unknown as IActionThreshold;
    } catch (error) {
      console.error('Error toggling threshold status:', error);
      throw new Error('Failed to toggle threshold status');
    }
  }

  /**
   * Get threshold by ID
   */
  static async getThresholdById(thresholdId: string): Promise<IActionThreshold | null> {
    try {
      const threshold = await ActionThresholdModel.findById(thresholdId).lean();
      return threshold as unknown as IActionThreshold | null;
    } catch (error) {
      console.error('Error fetching threshold by ID:', error);
      throw new Error('Failed to fetch threshold');
    }
  }

  /**
   * Check if threshold conditions are met
   */
  static checkThresholdConditions(
    threshold: IActionThreshold, 
    ticketData: TicketData
  ): boolean {
    return threshold.conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, ticketData);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'greater_than':
          return (fieldValue as number) > (condition.value as number);
        case 'less_than':
          return (fieldValue as number) < (condition.value as number);
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Get field value from ticket data
   */
  private static getFieldValue(field: string, ticketData: TicketData): unknown {
    const fieldMap: Record<string, unknown> = {
      'priority': ticketData.priority,
      'satisfaction_rating': ticketData.satisfactionRating,
      'ticket_age_hours': ticketData.ticketAgeHours,
      'customer_tier': ticketData.customerTier,
      'status': ticketData.status,
      'tags': ticketData.tags
    };
    
    return fieldMap[field] || null;
  }

  /**
   * Validate threshold data
   */
  static validateThresholdData(thresholdData: Partial<IActionThreshold>): string[] {
    const errors: string[] = [];

    if (!thresholdData.name) {
      errors.push('Threshold name is required');
    }

    if (!thresholdData.actionType) {
      errors.push('Action type is required');
    }

    if (thresholdData.threshold !== undefined && (thresholdData.threshold < 0 || thresholdData.threshold > 1)) {
      errors.push('Threshold must be between 0 and 1');
    }

    if (!thresholdData.conditions || thresholdData.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (thresholdData.conditions) {
      thresholdData.conditions.forEach((condition, index) => {
        if (!condition.field) {
          errors.push(`Condition ${index + 1}: Field is required`);
        }
        if (!condition.operator) {
          errors.push(`Condition ${index + 1}: Operator is required`);
        }
        if (condition.value === undefined || condition.value === null) {
          errors.push(`Condition ${index + 1}: Value is required`);
        }
      });
    }

    return errors;
  }

  /**
   * Get threshold statistics
   */
  static async getThresholdStats(organizationId: string): Promise<ThresholdStats[]> {
    try {
      const stats = await ActionThresholdModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId)
          }
        },
        {
          $group: {
            _id: '$actionType',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            avgThreshold: { $avg: '$threshold' },
            avgPriority: { $avg: '$priority' }
          }
        }
      ]);

      return stats as ThresholdStats[];
    } catch (error) {
      console.error('Error fetching threshold stats:', error);
      throw new Error('Failed to fetch threshold statistics');
    }
  }
} 