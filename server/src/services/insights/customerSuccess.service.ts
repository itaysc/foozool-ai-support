import { UserContextManager } from 'src/context/userContext';
import { CustomerModel } from '../../schemas';
import { FeatureUsageModel } from '../../schemas/featureUsage.schema';

export interface CustomerSuccessInsight {
  type: 'declining_usage' | 'dormant_feature' | 'low_adoption' | 'one_user_dependency' | 'feature_churn';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  meta?: Record<string, any>;
}

export async function generateCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId =UserContextManager.getCurrentOrganizationId()
  const insights: CustomerSuccessInsight[] = [];
  const now = new Date();
  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);
  const last60Start = new Date(now);
  last60Start.setDate(now.getDate() - 60);
  const last90Start = new Date(now);
  last90Start.setDate(now.getDate() - 90);

  // Load customer for adoption-related checks
  const customer = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();

  // 1) Declining usage: compare last 30d vs previous 30d by sum of activeUsersCount
  const [last30Agg, prev30Agg] = await Promise.all([
    FeatureUsageModel.aggregate([
      { $match: { organizationId, customerId, usageDate: { $gte: last30Start, $lte: now } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$activeUsersCount', 0] } } } },
    ]),
    FeatureUsageModel.aggregate([
      { $match: { organizationId, customerId, usageDate: { $gte: prev30Start, $lt: last30Start } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$activeUsersCount', 0] } } } },
    ]),
  ]);

  const last30Total = last30Agg[0]?.total || 0;
  const prev30Total = prev30Agg[0]?.total || 0;
  if (prev30Total > 0) {
    const change = ((last30Total - prev30Total) / prev30Total) * 100;
    if (change <= -35) {
      insights.push({
        type: 'declining_usage',
        message: `Feature usage dropped by ${Math.abs(Math.round(change))}% in the last 30 days.`,
        severity: 'red',
        meta: { last30Total, prev30Total, change },
      });
    }
  }

  // 2) Dormant features: not used in last 60 days but used before
  const dormantFeatures = await FeatureUsageModel.aggregate([
    { $match: { organizationId, customerId } },
    { $group: { _id: '$featureId', featureName: { $first: '$featureName' }, lastUsage: { $max: '$usageDate' } } },
    { $match: { lastUsage: { $lt: last60Start } } },
  ]);
  for (const f of dormantFeatures) {
    insights.push({
      type: 'dormant_feature',
      message: `Customer hasn’t used ${f.featureName} in 60 days, which may be core to ROI.`,
      severity: 'red',
      meta: { featureId: f._id, featureName: f.featureName, lastUsage: f.lastUsage },
    });
  }

  // 3) Low adoption post-onboarding: 10% or less active after 90 days
  if (customer?.startDate && customer.usageData?.seatsPurchased) {
    const started = new Date(customer.startDate);
    if (started < last90Start) {
      const seats = customer.usageData.seatsPurchased || 0;
      const active = customer.usageData.activeUsersCount || 0;
      if (seats > 0) {
        const adoption = (active / seats) * 100;
        if (adoption <= 10) {
          insights.push({
            type: 'low_adoption',
            message: `Only ${Math.round(adoption)}% of licensed users are active after 90 days.`,
            severity: 'red',
            meta: { seatsPurchased: seats, activeUsersCount: active },
          });
        }
      }
    }
  }

  // 4) One-user dependency: heuristic based on activeUsersCount
  if (customer?.usageData?.activeUsersCount !== undefined) {
    if ((customer.usageData.activeUsersCount || 0) <= 1) {
      insights.push({
        type: 'one_user_dependency',
        message: '90% of activity likely comes from a single user — high risk if they leave.',
        severity: 'red',
        meta: { activeUsersCount: customer.usageData.activeUsersCount },
      });
    }
  }

  // 5) Feature churn: used before but not at all in last 30 days
  const churnCandidates = await FeatureUsageModel.aggregate([
    { $match: { organizationId, customerId } },
    { $group: { _id: '$featureId', featureName: { $first: '$featureName' }, last30Count: { $sum: { $cond: [{ $gte: ['$usageDate', last30Start] }, 1, 0] } }, totalCount: { $sum: 1 } } },
    { $match: { totalCount: { $gt: 0 }, last30Count: 0 } },
  ]);
  for (const f of churnCandidates) {
    insights.push({
      type: 'feature_churn',
      message: `They used to use ${f.featureName}, but stopped completely.`,
      severity: 'red',
      meta: { featureId: f._id, featureName: f.featureName },
    });
  }

  // Logging summary of generated insights
  try {
    const breakdown = insights.reduce<Record<string, number>>((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});
    console.log(
      `[CS Insights] org=${organizationId} customer=${customerId} -> total=${insights.length} | breakdown=${JSON.stringify(breakdown)} `
    );
  } catch {}

  return insights;
}


