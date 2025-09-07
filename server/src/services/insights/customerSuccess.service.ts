import { UserContextManager } from 'src/context/userContext';
import mongoose from 'mongoose';
import { CustomerModel } from '../../schemas';
import { FeatureUsageModel } from '../../schemas/featureUsage.schema';

export interface CustomerSuccessInsight {
  type: 'declining_usage' | 'dormant_feature' | 'low_adoption' | 'one_user_dependency' | 'feature_churn' | 'inactive_customer';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  meta?: Record<string, any>;
}

export async function generateCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId =UserContextManager.getCurrentOrganizationId()
  console.log(`[CS Insights] ▶️ start | org=${organizationId} customer=${customerId}`)
  const insights: CustomerSuccessInsight[] = [];
  const now = new Date();
  // Ensure ObjectId matching for FeatureUsage (which stores org/customer as ObjectId)
  const orgObjId = mongoose.Types.ObjectId.isValid(String(organizationId))
    ? new mongoose.Types.ObjectId(String(organizationId))
    : undefined;
  const custObjId = mongoose.Types.ObjectId.isValid(String(customerId))
    ? new mongoose.Types.ObjectId(String(customerId))
    : undefined;
  if (!orgObjId || !custObjId) {
    console.log(`[CS Insights] ⚠️ invalid ids for aggregation | orgObjId=${!!orgObjId} custObjId=${!!custObjId}`)
  }
  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);
  const last60Start = new Date(now);
  last60Start.setDate(now.getDate() - 60);
  const last90Start = new Date(now);
  last90Start.setDate(now.getDate() - 90);
  console.log(`[CS Insights] ⏱ windows | now=${now.toISOString()} last30=${last30Start.toISOString()} prev30=${prev30Start.toISOString()} last60=${last60Start.toISOString()} last90=${last90Start.toISOString()}`)

  // Load customer for adoption-related checks
  const customer = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
  if (!customer) {
    console.log(`[CS Insights] ⚠️ customer not found | org=${organizationId} customer=${customerId}`)
  } else {
    console.log(`[CS Insights] 👤 customer | name=${customer.name} seatsPurchased=${customer.usageData?.seatsPurchased ?? 'n/a'} activeUsersCount=${customer.usageData?.activeUsersCount ?? 'n/a'} startDate=${customer.startDate ? new Date(customer.startDate).toISOString() : 'n/a'}`)
  }
  const customerName = customer?.name || 'Customer';

  // 1) Declining usage: compare last 30d vs previous 30d by sum of activeUsersCount
  const [last30Agg, prev30Agg] = await Promise.all([
    FeatureUsageModel.aggregate([
      { $match: { organizationId: orgObjId ?? organizationId, customerId: custObjId ?? customerId, usageDate: { $gte: last30Start, $lte: now } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$activeUsersCount', 0] } } } },
    ]),
    FeatureUsageModel.aggregate([
      { $match: { organizationId: orgObjId ?? organizationId, customerId: custObjId ?? customerId, usageDate: { $gte: prev30Start, $lt: last30Start } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$activeUsersCount', 0] } } } },
    ]),
  ]);

  const last30Total = last30Agg[0]?.total || 0;
  const prev30Total = prev30Agg[0]?.total || 0;
  console.log(`[CS Insights] 📊 usage totals | last30Total=${last30Total} prev30Total=${prev30Total}`)
  if (prev30Total > 0) {
    const change = ((last30Total - prev30Total) / prev30Total) * 100;
    console.log(`[CS Insights] 📉 change=${change}`)
    if (change <= -35) {
      insights.push({
        type: 'declining_usage',
        message: `Feature usage declined by ${Math.abs(Math.round(change))}% over the last 30 days versus the prior 30‑day period.`,
        severity: 'red',
        meta: { last30Total, prev30Total, change, customerName },
      });
    }
  }

  // 2) Dormant features: not used in last 60 days but used before
  const dormantFeatures = await FeatureUsageModel.aggregate([
    { $match: { organizationId: orgObjId ?? organizationId, customerId: custObjId ?? customerId } },
    { $group: { _id: '$featureId', featureName: { $first: '$featureName' }, lastUsage: { $max: '$usageDate' } } },
    { $match: { lastUsage: { $lt: last60Start } } },
  ]);
  console.log(`[CS Insights] 💤 dormantFeatures count=${dormantFeatures.length}`)
  for (const f of dormantFeatures) {
    insights.push({
      type: 'dormant_feature',
      message: `${f.featureName} has not been used in over 60 days. Consider a re‑engagement or enablement touchpoint.`,
      severity: 'red',
      meta: { featureId: f._id, featureName: f.featureName, lastUsage: f.lastUsage, customerName },
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
        console.log(`[CS Insights] 🧮 adoption | active=${active} seats=${seats} adoption=${adoption}`)
        if (adoption <= 10) {
          insights.push({
            type: 'low_adoption',
            message: `Only ${Math.round(adoption)}% of licensed users are active 90+ days post‑onboarding. Prioritize adoption and enablement.`,
            severity: 'red',
            meta: { seatsPurchased: seats, activeUsersCount: active, customerName },
          });
        }
      }
    }
  }

  // 4) One-user dependency: heuristic based on activeUsersCount
  if (customer?.usageData?.activeUsersCount !== undefined) {
    if ((customer.usageData.activeUsersCount || 0) <= 1) {
      console.log(`[CS Insights] 👤 one_user_dependency triggered | activeUsersCount=${customer.usageData.activeUsersCount}`)
      insights.push({
        type: 'one_user_dependency',
        message: 'Engagement appears concentrated with a single user, indicating continuity risk if that user churns.',
        severity: 'red',
        meta: { activeUsersCount: customer.usageData.activeUsersCount, customerName },
      });
    }
  }

  // 5) Feature churn: used before but not at all in last 30 days
  const churnCandidates = await FeatureUsageModel.aggregate([
    { $match: { organizationId: orgObjId ?? organizationId, customerId: custObjId ?? customerId } },
    { $group: { _id: '$featureId', featureName: { $first: '$featureName' }, last30Count: { $sum: { $cond: [{ $gte: ['$usageDate', last30Start] }, 1, 0] } }, totalCount: { $sum: 1 } } },
    { $match: { totalCount: { $gt: 0 }, last30Count: 0 } },
  ]);
  console.log(`[CS Insights] 🔁 feature_churn candidates=${churnCandidates.length}`)
  for (const f of churnCandidates) {
    insights.push({
      type: 'feature_churn',
      message: `Usage of ${f.featureName} has ceased in the last 30 days despite prior adoption. Investigate underlying causes and propose recovery actions.`,
      severity: 'red',
      meta: { featureId: f._id, featureName: f.featureName, customerName },
    });
  }

  // 6) Inactive customer: no feature usage across all features in the last 60 days
  try {
    const recentUsageCount = await FeatureUsageModel.countDocuments({
      organizationId: orgObjId ?? organizationId,
      customerId: custObjId ?? customerId,
      usageDate: { $gte: last60Start }
    });
    if (recentUsageCount === 0) {
      insights.push({
        type: 'inactive_customer',
        message: `No feature activity detected in the past 60 days. Consider outreach to re‑engage stakeholders and review adoption blockers.`,
        severity: 'red',
        meta: { customerName, windowDays: 60 }
      });
    }
  } catch {}

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
  console.log(`[CS Insights] ✅ done | total=${insights.length}`)

  return insights;
}


