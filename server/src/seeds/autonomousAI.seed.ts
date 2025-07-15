import { ActionThresholdModel, CustomerTierModel, OrganizationModel } from '../schemas';
import { Types } from 'mongoose';

export const seedAutonomousAI = async () => {
  try {
    console.log('🌱 Seeding Autonomous AI data...');

    // Get the first organization (assuming it exists)
    const organization = await OrganizationModel.findOne();
    if (!organization) {
      console.log('⚠️  No organization found. Please seed organizations first.');
      return;
    }

    const organizationId = organization._id;

    // Create default customer tiers
    console.log('📊 Creating default customer tiers...');
    const defaultTiers = [
      {
        name: 'bronze',
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
        name: 'silver',
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
        name: 'gold',
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
        name: 'platinum',
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
          organization: organizationId,
          name: tierData.name
        },
        {
          ...tierData,
          organization: organizationId
        },
        { upsert: true, new: true }
      );
    }

    // Create sample action thresholds
    console.log('⚙️  Creating sample action thresholds...');
    const sampleThresholds = [
      {
        name: 'Low Satisfaction Auto-Reply',
        description: 'Automatically reply to tickets with low satisfaction ratings',
        actionType: 'auto_reply',
        conditions: [
          { field: 'satisfaction_rating', operator: 'less_than', value: 3 }
        ],
        threshold: 0.7,
        isActive: true,
        priority: 1,
        maxDailyActions: 50,
        actionConfig: {
          autoReplyTemplate: 'We apologize for the inconvenience. Our team is working to resolve your issue. Please expect a response within 24 hours.'
        }
      },
      {
        name: 'High Priority Escalation',
        description: 'Escalate urgent tickets automatically',
        actionType: 'escalate',
        conditions: [
          { field: 'priority', operator: 'equals', value: 'urgent' }
        ],
        threshold: 0.8,
        isActive: true,
        priority: 2,
        maxDailyActions: 20,
        actionConfig: {
          escalationLevel: 'critical'
        }
      },
      {
        name: 'Gold Customer Refund',
        description: 'Auto-refund for gold tier customers with defective products',
        actionType: 'refund',
        conditions: [
          { field: 'customer_tier', operator: 'equals', value: 'gold' },
          { field: 'tags', operator: 'contains', value: 'defective' }
        ],
        threshold: 0.9,
        isActive: true,
        priority: 3,
        maxDailyActions: 5,
        actionConfig: {
          refundAmount: 50
        }
      },
      {
        name: 'Platinum Customer Coupon',
        description: 'Provide discount coupon to platinum customers for delays',
        actionType: 'coupon',
        conditions: [
          { field: 'customer_tier', operator: 'equals', value: 'platinum' },
          { field: 'tags', operator: 'contains', value: 'delay' }
        ],
        threshold: 0.75,
        isActive: true,
        priority: 2,
        maxDailyActions: 10,
        actionConfig: {
          couponCode: 'PLATINUM_APOLOGY',
          couponDiscount: 25
        }
      },
      {
        name: 'Old Ticket Auto-Resolve',
        description: 'Auto-resolve tickets older than 72 hours for simple issues',
        actionType: 'auto_resolve',
        conditions: [
          { field: 'ticket_age_hours', operator: 'greater_than', value: 72 },
          { field: 'priority', operator: 'equals', value: 'low' }
        ],
        threshold: 0.6,
        isActive: true,
        priority: 1,
        maxDailyActions: 30,
        actionConfig: {}
      },
      {
        name: 'Priority Upgrade for VIP',
        description: 'Upgrade priority for platinum customers',
        actionType: 'priority_change',
        conditions: [
          { field: 'customer_tier', operator: 'equals', value: 'platinum' },
          { field: 'priority', operator: 'equals', value: 'normal' }
        ],
        threshold: 0.7,
        isActive: true,
        priority: 2,
        maxDailyActions: 15,
        actionConfig: {
          newPriority: 'high'
        }
      }
    ];

    for (const thresholdData of sampleThresholds) {
      await ActionThresholdModel.findOneAndUpdate(
        {
          organization: organizationId,
          name: thresholdData.name
        },
        {
          ...thresholdData,
          organization: organizationId
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Autonomous AI seeding completed successfully!');
    console.log(`📊 Created ${defaultTiers.length} customer tiers`);
    console.log(`⚙️  Created ${sampleThresholds.length} action thresholds`);

  } catch (error) {
    console.error('❌ Error seeding Autonomous AI data:', error);
    throw error;
  }
};

export const clearAutonomousAIData = async () => {
  try {
    console.log('🧹 Clearing Autonomous AI data...');
    
    await ActionThresholdModel.deleteMany({});
    await CustomerTierModel.deleteMany({});
    
    console.log('✅ Autonomous AI data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing Autonomous AI data:', error);
    throw error;
  }
}; 