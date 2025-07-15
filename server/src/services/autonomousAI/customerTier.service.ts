import { CustomerTierModel } from '../../schemas';
import { ICustomerTier, ICustomerTierInput, CustomerTierName } from '../../types/autonomousAI';
import { Types } from 'mongoose';

export class CustomerTierService {
  /**
   * Create a new customer tier
   */
  static async createTier(tierData: ICustomerTierInput): Promise<ICustomerTier> {
    try {
      const tier = new CustomerTierModel(tierData);
      const savedTier = await tier.save();
      return savedTier.toObject() as unknown as ICustomerTier;
    } catch (error) {
      console.error('Error creating customer tier:', error);
      throw new Error('Failed to create customer tier');
    }
  }

  /**
   * Get all tiers for an organization
   */
  static async getTiersByOrganization(organizationId: string): Promise<ICustomerTier[]> {
    try {
      const tiers = await CustomerTierModel.find({
        organization: new Types.ObjectId(organizationId)
      }).sort({ priority: -1 }).lean();
      return tiers as unknown as ICustomerTier[];
    } catch (error) {
      console.error('Error fetching customer tiers:', error);
      throw new Error('Failed to fetch customer tiers');
    }
  }

  /**
   * Get tier by name and organization
   */
  static async getTierByName(
    organizationId: string, 
    tierName: CustomerTierName
  ): Promise<ICustomerTier | null> {
    try {
      const tier = await CustomerTierModel.findOne({
        organization: new Types.ObjectId(organizationId),
        name: tierName
      }).lean();
      return tier as unknown as ICustomerTier | null;
    } catch (error) {
      console.error('Error fetching customer tier by name:', error);
      throw new Error('Failed to fetch customer tier');
    }
  }

  /**
   * Update a customer tier
   */
  static async updateTier(
    tierId: string, 
    updateData: Partial<ICustomerTier>
  ): Promise<ICustomerTier | null> {
    try {
      const tier = await CustomerTierModel.findByIdAndUpdate(
        tierId,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).lean();
      return tier as unknown as ICustomerTier | null;
    } catch (error) {
      console.error('Error updating customer tier:', error);
      throw new Error('Failed to update customer tier');
    }
  }

  /**
   * Delete a customer tier
   */
  static async deleteTier(tierId: string): Promise<boolean> {
    try {
      const result = await CustomerTierModel.findByIdAndDelete(tierId);
      return !!result;
    } catch (error) {
      console.error('Error deleting customer tier:', error);
      throw new Error('Failed to delete customer tier');
    }
  }

  /**
   * Get tier by ID
   */
  static async getTierById(tierId: string): Promise<ICustomerTier | null> {
    try {
      const tier = await CustomerTierModel.findById(tierId).lean();
      return tier as unknown as ICustomerTier | null;
    } catch (error) {
      console.error('Error fetching customer tier by ID:', error);
      throw new Error('Failed to fetch customer tier');
    }
  }

  /**
   * Check if action is permitted for a tier
   */
  static isActionPermitted(
    tier: ICustomerTier, 
    actionType: string, 
    amount?: number
  ): boolean {
    const permissions = tier.autoActionPermissions;
    const actionPermission = permissions[actionType as keyof typeof permissions];
    
    if (!actionPermission?.enabled) {
      return false;
    }

    // Check amount limits for specific actions
    if (actionType === 'refund' && amount) {
      const refundPermission = actionPermission as any;
      if (refundPermission.maxAmount) {
        return amount <= refundPermission.maxAmount;
      }
    }

    if (actionType === 'coupon' && amount) {
      const couponPermission = actionPermission as any;
      if (couponPermission.maxDiscount) {
        return amount <= couponPermission.maxDiscount;
      }
    }

    return true;
  }

  /**
   * Get daily action count for a tier
   */
  static async getDailyActionCount(
    organizationId: string,
    tierName: CustomerTierName,
    actionType: string
  ): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // This would need to be implemented with actual action logs
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      console.error('Error getting daily action count:', error);
      return 0;
    }
  }

  /**
   * Check if daily limit is reached for a tier
   */
  static async isDailyLimitReached(
    organizationId: string,
    tierName: CustomerTierName,
    actionType: string
  ): Promise<boolean> {
    try {
      const tier = await this.getTierByName(organizationId, tierName);
      if (!tier) {
        return true; // No tier found, assume limit reached
      }

      const permissions = tier.autoActionPermissions;
      const actionPermission = permissions[actionType as keyof typeof permissions];
      
      // Check if action type has daily count limits
      if (actionType === 'autoResolve') {
        // Auto-resolve doesn't have daily count limits, only ticket age limits
        return false;
      }
      
      // For other action types, check maxDailyCount
      const maxDailyCount = (actionPermission as any)?.maxDailyCount;
      if (!maxDailyCount) {
        return false; // No limit set
      }

      const dailyCount = await this.getDailyActionCount(organizationId, tierName, actionType);
      return dailyCount >= maxDailyCount;
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return true; // Assume limit reached on error
    }
  }

  /**
   * Create default tiers for an organization
   */
  static async createDefaultTiers(organizationId: string): Promise<void> {
    try {
      const defaultTiers = [
        {
          name: 'bronze' as CustomerTierName,
          description: 'Basic customer tier with limited auto-actions',
          priority: 1,
          autoActionPermissions: {
            refund: { enabled: false, maxAmount: 0, maxDailyCount: 0 },
            coupon: { enabled: false, maxDiscount: 0, maxDailyCount: 0 },
            autoResolve: { enabled: false, maxTicketAgeHours: 0 },
            escalation: { enabled: false, maxEscalationLevel: 'low' },
            priorityChange: { enabled: false, allowedPriorities: [] },
            autoReply: { enabled: true, maxDailyCount: 5 }
          },
          satisfactionThresholds: {
            lowSatisfactionThreshold: 2,
            highSatisfactionThreshold: 4
          }
        },
        {
          name: 'silver' as CustomerTierName,
          description: 'Standard customer tier with moderate auto-actions',
          priority: 2,
          autoActionPermissions: {
            refund: { enabled: false, maxAmount: 0, maxDailyCount: 0 },
            coupon: { enabled: true, maxDiscount: 10, maxDailyCount: 2 },
            autoResolve: { enabled: false, maxTicketAgeHours: 0 },
            escalation: { enabled: true, maxEscalationLevel: 'medium' },
            priorityChange: { enabled: true, allowedPriorities: ['normal', 'low'] },
            autoReply: { enabled: true, maxDailyCount: 10 }
          },
          satisfactionThresholds: {
            lowSatisfactionThreshold: 3,
            highSatisfactionThreshold: 4
          }
        },
        {
          name: 'gold' as CustomerTierName,
          description: 'Premium customer tier with enhanced auto-actions',
          priority: 3,
          autoActionPermissions: {
            refund: { enabled: true, maxAmount: 50, maxDailyCount: 1 },
            coupon: { enabled: true, maxDiscount: 25, maxDailyCount: 3 },
            autoResolve: { enabled: true, maxTicketAgeHours: 48 },
            escalation: { enabled: true, maxEscalationLevel: 'high' },
            priorityChange: { enabled: true, allowedPriorities: ['high', 'normal', 'low'] },
            autoReply: { enabled: true, maxDailyCount: 15 }
          },
          satisfactionThresholds: {
            lowSatisfactionThreshold: 3,
            highSatisfactionThreshold: 4
          }
        },
        {
          name: 'platinum' as CustomerTierName,
          description: 'VIP customer tier with full auto-action capabilities',
          priority: 4,
          autoActionPermissions: {
            refund: { enabled: true, maxAmount: 200, maxDailyCount: 2 },
            coupon: { enabled: true, maxDiscount: 50, maxDailyCount: 5 },
            autoResolve: { enabled: true, maxTicketAgeHours: 24 },
            escalation: { enabled: true, maxEscalationLevel: 'critical' },
            priorityChange: { enabled: true, allowedPriorities: ['urgent', 'high', 'normal', 'low'] },
            autoReply: { enabled: true, maxDailyCount: 20 }
          },
          satisfactionThresholds: {
            lowSatisfactionThreshold: 4,
            highSatisfactionThreshold: 5
          }
        }
      ];

      for (const tierData of defaultTiers) {
        await CustomerTierModel.findOneAndUpdate(
          {
            organization: new Types.ObjectId(organizationId),
            name: tierData.name
          },
          {
            ...tierData,
            organization: new Types.ObjectId(organizationId)
          },
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Error creating default tiers:', error);
      throw new Error('Failed to create default customer tiers');
    }
  }

  /**
   * Validate tier data
   */
  static validateTierData(tierData: Partial<ICustomerTier>): string[] {
    const errors: string[] = [];

    if (!tierData.name) {
      errors.push('Tier name is required');
    }

    if (tierData.priority !== undefined && tierData.priority < 0) {
      errors.push('Priority must be non-negative');
    }

    if (tierData.autoActionPermissions) {
      const permissions = tierData.autoActionPermissions;
      
      // Validate refund permissions
      if (permissions.refund) {
        if (permissions.refund.maxAmount < 0) {
          errors.push('Refund max amount must be non-negative');
        }
        if (permissions.refund.maxDailyCount < 0) {
          errors.push('Refund max daily count must be non-negative');
        }
      }

      // Validate coupon permissions
      if (permissions.coupon) {
        if (permissions.coupon.maxDiscount < 0) {
          errors.push('Coupon max discount must be non-negative');
        }
        if (permissions.coupon.maxDailyCount < 0) {
          errors.push('Coupon max daily count must be non-negative');
        }
      }

      // Validate auto-resolve permissions
      if (permissions.autoResolve) {
        if (permissions.autoResolve.maxTicketAgeHours < 0) {
          errors.push('Auto-resolve max ticket age must be non-negative');
        }
      }

      // Validate auto-reply permissions
      if (permissions.autoReply) {
        if (permissions.autoReply.maxDailyCount < 0) {
          errors.push('Auto-reply max daily count must be non-negative');
        }
      }
    }

    if (tierData.satisfactionThresholds) {
      const thresholds = tierData.satisfactionThresholds;
      
      if (thresholds.lowSatisfactionThreshold < 1 || thresholds.lowSatisfactionThreshold > 5) {
        errors.push('Low satisfaction threshold must be between 1 and 5');
      }
      
      if (thresholds.highSatisfactionThreshold < 1 || thresholds.highSatisfactionThreshold > 5) {
        errors.push('High satisfaction threshold must be between 1 and 5');
      }
      
      if (thresholds.lowSatisfactionThreshold >= thresholds.highSatisfactionThreshold) {
        errors.push('Low satisfaction threshold must be less than high satisfaction threshold');
      }
    }

    return errors;
  }

  /**
   * Get tier statistics
   */
  static async getTierStats(organizationId: string): Promise<any> {
    try {
      const stats = await CustomerTierModel.aggregate([
        {
          $match: {
            organization: new Types.ObjectId(organizationId)
          }
        },
        {
          $group: {
            _id: null,
            totalTiers: { $sum: 1 },
            avgPriority: { $avg: '$priority' },
            maxPriority: { $max: '$priority' },
            minPriority: { $min: '$priority' }
          }
        }
      ]);

      return stats[0] || {
        totalTiers: 0,
        avgPriority: 0,
        maxPriority: 0,
        minPriority: 0
      };
    } catch (error) {
      console.error('Error fetching tier stats:', error);
      throw new Error('Failed to fetch tier statistics');
    }
  }
} 