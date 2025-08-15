import { ThresholdMissModel, SeedTrackModel, OrganizationModel } from '../schemas';
import { Types } from 'mongoose';

export async function seedThresholdMisses(): Promise<any[]> {
  try {
    const thresholdMissesSeeded = await SeedTrackModel.findOne({ name: 'thresholdMisses', status: 'completed' }).lean();
    if (thresholdMissesSeeded) {
      console.log('Threshold misses already seeded, skipping...');
      return await ThresholdMissModel.find({}).lean();
    }

    // Get the demo organization
    const demoOrg = await OrganizationModel.findOne({ name: 'demo organization' }).lean();
    if (!demoOrg) {
      console.log('Demo organization not found, skipping threshold miss seeding...');
      return [];
    }

    const thresholdMissSeed = [
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'refund',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'High Confidence Refund',
        thresholdValue: 0.85,
        confidenceScore: 0.72,
        missedBy: 0.13,
        ticketSubject: 'Customer requesting refund for delayed delivery',
        ticketStatus: 'open',
        ticketPriority: 'high',
        customerTier: 'premium',
        occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'coupon',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'Apology Coupon',
        thresholdValue: 0.75,
        confidenceScore: 0.68,
        missedBy: 0.07,
        ticketSubject: 'Service quality complaint',
        ticketStatus: 'open',
        ticketPriority: 'medium',
        customerTier: 'standard',
        occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'auto_resolve',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'Simple Query Auto-Resolve',
        thresholdValue: 0.90,
        confidenceScore: 0.82,
        missedBy: 0.08,
        ticketSubject: 'Password reset request',
        ticketStatus: 'pending',
        ticketPriority: 'low',
        customerTier: 'standard',
        occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'escalate',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'Urgent Escalation',
        thresholdValue: 0.80,
        confidenceScore: 0.65,
        missedBy: 0.15,
        ticketSubject: 'Critical system outage affecting multiple users',
        ticketStatus: 'urgent',
        ticketPriority: 'critical',
        customerTier: 'enterprise',
        occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'priority_change',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'Priority Boost',
        thresholdValue: 0.70,
        confidenceScore: 0.58,
        missedBy: 0.12,
        ticketSubject: 'Feature request for mobile app',
        ticketStatus: 'open',
        ticketPriority: 'medium',
        customerTier: 'premium',
        occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        organization: demoOrg._id,
        ticketId: new Types.ObjectId(),
        actionType: 'auto_reply',
        thresholdId: new Types.ObjectId(),
        thresholdName: 'Standard Auto-Reply',
        thresholdValue: 0.60,
        confidenceScore: 0.45,
        missedBy: 0.15,
        ticketSubject: 'General inquiry about services',
        ticketStatus: 'open',
        ticketPriority: 'low',
        customerTier: 'standard',
        occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      }
    ];

    const result = await ThresholdMissModel.insertMany(thresholdMissSeed);
    console.log(`Inserted ${result.length} threshold misses`);
    
    await SeedTrackModel.create({ 
      name: 'thresholdMisses', 
      date: new Date(), 
      status: 'completed' 
    });
    
    return result;
  } catch (error) {
    console.error('Error seeding threshold misses:', error);
    throw error;
  }
}
