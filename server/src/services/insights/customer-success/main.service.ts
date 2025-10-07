import { UserContextManager } from '../../../context/userContext';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import { CustomerModel, CustomerActivityModel } from '../../../schemas';
import { callLLM } from '../../llm';
import { InsightModel } from '../../../schemas/insights.schema';
import { assignInsightNumberAtomic } from '../insightNumber.service';
import { generateTicketInsights, TicketInsight } from '../ticketInsights.service';
import { generateStakeholderInsights as generateStakeholderInsightsFromModule } from '../stakeholders';
import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';

// Import individual insight generators
import { generateFinancialRiskAlerts } from './financial-risk.service';
import { generateUserEngagementInsights } from './user-engagement.service';
import { generateRiskAlerts } from './risk-alerts.service';
import { generateUpsellOpportunities } from './upsell-opportunities.service';
import { generateCustomerSuccessPrep } from './success-prep.service';
import { generateStrategicInsights } from './strategic-insights.service';

const { ObjectId } = mongoose.Types;

// Module-level SLA resolver so it can be used from persistence helpers
async function resolveSLAForCustomer(
  organizationId: string,
  customerId: string,
  insight: CustomerSuccessInsight
): Promise<{ name: string; amount: number; unit: 'minutes' | 'hours' | 'days' } | undefined> {
  try {
    const cust = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
    const slas = (cust as any)?.slas || [];
    if (!Array.isArray(slas) || slas.length === 0) return undefined;
    const prompt = `You are a Customer Success Assistant. Given the following insight and a list of customer-defined SLAs, choose the most appropriate SLA by name, amount and unit. If none match exactly, pick the closest match and explain in one sentence.\nInsight JSON: ${JSON.stringify({ type: insight.type, category: insight.category, severity: insight.severity, message: insight.message, meta: insight.meta }).slice(0, 4000)}\nAvailable SLAs: ${JSON.stringify(slas).slice(0, 4000)}\nReturn ONLY compact JSON: {"name": string, "amount": number, "unit": "minutes"|"hours"|"days"}.`;
    const res: any = await callLLM({ userId: UserContextManager.getCurrentUserId() || '', isChat: false, systemMsg: 'Select appropriate SLA.', prompt, maxTokens: 200, temperature: 0 });
    if (!res?.data) return undefined;
    try { return JSON.parse(res.data); } catch { return undefined; }
  } catch (e) {
    console.warn('[CS Insights] SLA resolution failed:', e);
    return undefined;
  }
}

export async function getSavedStakeholderInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  if (!organizationId || !ObjectId.isValid(String(organizationId))) return [];

  const orgObjId = new ObjectId(String(organizationId));
  const custObjId = new ObjectId(String(customerId));

  if (!orgObjId || !custObjId) return [];

  try {
    // Only fetch stakeholder insights (those with clusterId starting with 'stakeholder:')
    const savedInsights = await InsightModel.find({
      organizationId: orgObjId,
      customerId: custObjId,
      insightType: 'customer_success',
      clusterId: { $regex: /^stakeholder:/ }
    }).sort({ lastUpdatedAt: -1 }).lean();

    return savedInsights.map(insight => ({
      id: insight._id.toString(),
      insightNumber: insight.insightNumber,
      type: insight.metadata?.type as CustomerSuccessInsight['type'],
      message: insight.issueDescription,
      severity: insight.metadata?.severity as CustomerSuccessInsight['severity'],
      category: insight.metadata?.category as CustomerSuccessInsight['category'],
      meta: insight.metadata?.meta || {},
      assignee: insight.assignee?.toString(),
      status: insight.status || 'new',
      createdAt: insight.firstDetectedAt?.toISOString() || insight.lastUpdatedAt?.toISOString(),
      customerId: insight.customerId?.toString(),
      customerName: insight.customerName
    }));
  } catch (error) {
    console.error('[CS Insights] ❌ failed to fetch saved stakeholder insights:', error);
    return [];
  }
}

export async function getAllSavedCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  if (!organizationId || !ObjectId.isValid(String(organizationId))) return [];

  const orgObjId = new ObjectId(String(organizationId));
  const custObjId = new ObjectId(String(customerId));

  if (!orgObjId || !custObjId) return [];

  try {
    const savedInsights = await InsightModel.find({
      organizationId: orgObjId,
      customerId: custObjId,
      insightType: 'customer_success'
    }).sort({ lastUpdatedAt: -1 }).lean();

    return savedInsights.map(insight => ({
      id: insight._id.toString(),
      insightNumber: insight.insightNumber,
      type: insight.metadata?.type as CustomerSuccessInsight['type'],
      message: insight.issueDescription,
      severity: insight.metadata?.severity as CustomerSuccessInsight['severity'],
      category: insight.metadata?.category as CustomerSuccessInsight['category'],
      meta: insight.metadata?.meta || {},
      assignee: insight.assignee?.toString(),
      status: insight.status || 'new',
      createdAt: insight.firstDetectedAt?.toISOString() || insight.lastUpdatedAt?.toISOString(),
      customerId: insight.customerId?.toString(),
      customerName: insight.customerName
    }));
  } catch (error) {
    console.error('[CS Insights] ❌ failed to fetch all saved customer success insights:', error);
    return [];
  }
}

export async function generateCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }
  return generateCustomerSuccessInsightsForOrganization(customerId, organizationId);
}

export async function generateCustomerSuccessInsightsForOrganization(customerId: string, organizationId: string): Promise<CustomerSuccessInsight[]> {
  console.log(`[CS Insights] ▶️ start | org=${organizationId} customer=${customerId}`);
  const insights: CustomerSuccessInsight[] = [];
  const now = new Date();
  
  // Ensure ObjectId matching for CustomerActivity
  const orgObjId = ObjectId.isValid(String(organizationId))
    ? new ObjectId(String(organizationId))
    : undefined;
  const custObjId = ObjectId.isValid(String(customerId))
    ? new ObjectId(String(customerId))
    : undefined;
  
  if (!orgObjId || !custObjId) {
    console.log(`[CS Insights] ⚠️ invalid ids for aggregation | orgObjId=${!!orgObjId} custObjId=${!!custObjId}`);
    return insights;
  }

  // Time windows
  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);
  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);
  const last60Start = new Date(now);
  last60Start.setDate(now.getDate() - 60);

  // Load customer and activities
  const customer = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
  if (!customer) {
    console.log(`[CS Insights] ⚠️ customer not found | org=${organizationId} customer=${customerId}`);
    return insights;
  }

  const customerName = customer.name || 'Customer';

  // Get all activities for this customer
  const activities = await CustomerActivityModel.find({ 
    customerId: custObjId,
    organizationId: orgObjId
  }).sort({ activityDate: -1, createdAt: -1 }).lean();

  console.log(`[CS Insights] 📊 activities | count=${activities.length}`);

  // Helper: choose SLA via LLM based on customer-defined SLAs and insight context
  async function resolveSLA(insight: CustomerSuccessInsight): Promise<any | undefined> {
    try {
      const cust = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
      const slas = (cust as any)?.slas || [];
      if (!Array.isArray(slas) || slas.length === 0) return undefined;
      const prompt = `You are a Customer Success Assistant. Given the following insight and a list of customer-defined SLAs, choose the most appropriate SLA by name, amount and unit. If none match, select the closest.
Insight JSON: ${JSON.stringify({ type: insight.type, category: insight.category, severity: insight.severity, message: insight.message, meta: insight.meta }).slice(0, 4000)}
Available SLAs: ${JSON.stringify(slas).slice(0, 4000)}
Return ONLY a JSON object with fields {"name": string, "amount": number, "unit": "minutes"|"hours"|"days"}.`;
      const currentUserId = UserContextManager.getCurrentUserId();
      if (!currentUserId) return undefined;
      const res: any = await callLLM({ userId: currentUserId, isChat: false, systemMsg: 'Select appropriate SLA.', prompt, maxTokens: 200, temperature: 0 });
      if (!res?.data) return undefined;
      try { return JSON.parse(res.data); } catch { return undefined; }
    } catch (e) {
      console.warn('[CS Insights] SLA resolution failed:', e);
      return undefined;
    }
  }

  // Get activities for comparison (same organization, different customers)
  const orgActivities = await CustomerActivityModel.find({ 
    organizationId: orgObjId
  }).lean();

  // Generate insights by category
  const riskInsights = generateRiskAlerts(activities, customerName, last30Start, prev30Start, last60Start);
  const financialRiskInsights = generateFinancialRiskAlerts(customer);
  const userEngagementInsights = await generateUserEngagementInsights(custObjId, orgObjId, customerName);
  const upsellInsights = generateUpsellOpportunities(activities, orgActivities, customerName);
  const successPrepInsights = generateCustomerSuccessPrep(activities, customerName);
  const strategicInsights = generateStrategicInsights(activities, customerName);
  
  // Generate stakeholder-specific insights (these are persisted separately)
  const stakeholderInsights = generateStakeholderInsightsFromModule(customer);

  // Generate Ticket Insights
  let ticketInsights: CustomerSuccessInsight[] = [];
  try {
    console.log(`[CS Insights] 🎫 generating ticket insights for customer ${customerId}`);
    ticketInsights = await generateTicketInsights(customerId);
    console.log(`[CS Insights] ✅ added ${ticketInsights.length} ticket insights`);
  } catch (error) {
    console.error(`[CS Insights] ❌ failed to generate ticket insights:`, error);
  }

  // Persist stakeholder insights separately (as they were before)
  try {
    await persistStakeholderInsights(organizationId, String(customer._id), customer.name || 'Customer', stakeholderInsights);
  } catch (e) {
    console.error('[CS Insights] ❌ failed to persist stakeholder insights:', e);
  }

  // Persist other customer success insights (risk, upsell, strategic, ticket insights)
  const otherInsights = [
    ...riskInsights,
    ...financialRiskInsights,
    ...userEngagementInsights,
    ...upsellInsights,
    ...successPrepInsights,
    ...strategicInsights,
    ...ticketInsights
  ];

  try {
    await persistCustomerSuccessInsights(organizationId, String(customer._id), customer.name || 'Customer', otherInsights);
  } catch (e) {
    console.error('[CS Insights] ❌ failed to persist other customer success insights:', e);
  }

  // Combine all insights for return
  insights.push(...riskInsights);
  insights.push(...financialRiskInsights);
  insights.push(...userEngagementInsights);
  insights.push(...upsellInsights);
  insights.push(...successPrepInsights);
  insights.push(...strategicInsights);
  insights.push(...stakeholderInsights);
  insights.push(...ticketInsights);

  console.log(`[CS Insights] ✅ completed | total insights=${insights.length}`);
  return insights;
}

/**
 * Generate a deterministic cluster ID for deduplication
 */
function generateClusterId(insight: CustomerSuccessInsight, customerId: string, prefix: string): string {
  // Create a hash based on insight content for deduplication
  const contentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      type: insight.type,
      message: insight.message,
      severity: insight.severity,
      category: insight.category,
      customerId: customerId,
      // Include relevant meta data for more precise deduplication
      meta: insight.meta ? JSON.stringify(insight.meta) : ''
    }))
    .digest('hex')
    .substring(0, 12); // Use first 12 characters for shorter IDs
  
  return `${prefix}:${contentHash}`;
}

/**
 * Persist stakeholder insights to database
 */
async function persistStakeholderInsights(organizationId: string, customerId: string, customerName: string, insights: CustomerSuccessInsight[]): Promise<void> {
  const orgObjId = new ObjectId(organizationId);
  const custObjId = new ObjectId(customerId);

  for (const insight of insights) {
    const clusterId = generateClusterId(insight, customerId, 'stakeholder');
    
    const attrs: any = {
      organizationId: orgObjId,
      customerId: custObjId,
      customerName: customerName,
      insightType: 'customer_success',
      clusterId: clusterId,
      issueDescription: insight.message,
      metadata: {
        type: insight.type,
        severity: insight.severity,
        category: insight.category,
        meta: { ...(insight.meta || {}), guidance: (() => {
          const base: any = {
            owner: 'CSM',
            slaDays: insight.severity === 'red' ? 2 : insight.severity === 'yellow' ? 5 : 7
          };
          switch (insight.type) {
            case 'activity_trend_decline':
              return {
                summary: `User activity declined ${insight.meta?.declinePercent ?? 'significantly'} in the last period at ${customerName}.`,
                why: 'Sustained activity decline is a leading indicator of churn risk and unmet value.',
                signals: [
                  `Active users change: ${insight.meta?.activeUsersPrev ?? '-'} → ${insight.meta?.activeUsersCurr ?? '-'}`,
                  `Sessions change: ${insight.meta?.sessionsPrev ?? '-'} → ${insight.meta?.sessionsCurr ?? '-'}`
                ],
                actions: [
                  'Identify cohorts with the steepest decline (roles/teams) and contact champions.',
                  'Offer a 20-minute enablement focusing on top-value workflows used before the decline.',
                  'Set a 2-week follow-up to confirm recovery (target +15% WoW).'
                ],
                considerations: 'Coordinate with Support if there were incidents in the same period that may explain the decline.',
                ...base
              };
            case 'feature_discovery':
              return {
                summary: `Low discovery of key feature(s) impacting value realization at ${customerName}.`,
                why: 'Under-used value drivers reduce perceived ROI and renewal likelihood.',
                signals: [
                  `Features with <10% seat usage: ${(insight.meta?.featuresUnderused || []).join(', ') || 'N/A'}`
                ],
                actions: [
                  'Send a targeted how-to with short video to relevant roles.',
                  'Schedule an enablement session; include 2-3 customer-specific use cases.',
                  'Add in-app guide for the feature entry point.'
                ],
                considerations: 'Align messaging with the customer’s stated objectives from the success plan.',
                ...base
              };
            case 'usage_pattern_anomaly':
              return {
                summary: `Detected anomalous usage pattern requiring investigation at ${customerName}.`,
                why: 'Anomalies can point to integration issues, user confusion, or adoption blockers.',
                signals: [
                  `Anomaly score: ${insight.meta?.anomalyScore ?? '-'}`,
                  `Impacted workflow: ${insight.meta?.workflow ?? '-'}`
                ],
                actions: [
                  'Validate recent releases/incidents; check error logs and support tickets.',
                  'Interview 2 power users to understand friction; document steps.',
                  'Open follow-up task for product/ops if systemic.'
                ],
                considerations: 'If systemic, communicate mitigation timeline to the customer.',
                ...base
              };
            case 'health_score_at_risk':
              return {
                summary: `Customer health is at risk (overall score ${insight.meta?.healthScore?.overallScore ?? '-'}/100).`,
                why: 'Composite leading indicators predict increased churn probability.',
                signals: [
                  `Engagement: ${insight.meta?.engagementHealth ?? '-'}`,
                  `Support: ${insight.meta?.supportHealth ?? '-'}`,
                  `Business: ${insight.meta?.businessHealth ?? '-'}`
                ],
                actions: [
                  'Schedule a recovery plan call this week with sponsor and champion.',
                  'Agree on 3 measurable actions (owner, due date) to move score +10 within 30 days.',
                  'Increase cadence to weekly until recovery is sustained for 2 weeks.'
                ],
                considerations: 'Share a short value recap deck to re-anchor ROI.',
                owner: 'CSM',
                slaDays: 5
              };
            default:
              return {
                summary: `Action recommended for ${String(insight.type).replace(/_/g,' ')} at ${customerName}.`,
                why: 'Signal crossed an actionable threshold based on trends and benchmarks.',
                actions: ['Review the signals and contact the stakeholder to define next steps.'],
                ...base
              };
          }
        })(), sla: await resolveSLAForCustomer(String(organizationId), String(customerId), insight) }
      },
      assignee: insight.assignee ? new ObjectId(insight.assignee) : undefined,
      status: insight.status || 'new',
      lastUpdatedAt: new Date()
    };
    const saved = await InsightModel.findOneAndUpdate(
      {
        organizationId: orgObjId,
        customerId: custObjId,
        insightType: 'customer_success',
        clusterId: clusterId
      },
      attrs,
      { upsert: true, new: true }
    );
    if (!saved.insightNumber) {
      await assignInsightNumberAtomic(saved._id as any);
    }
  }
}

/**
 * Persist customer success insights to database
 */
async function persistCustomerSuccessInsights(organizationId: string, customerId: string, customerName: string, insights: CustomerSuccessInsight[]): Promise<void> {
  const orgObjId = new ObjectId(organizationId);
  const custObjId = new ObjectId(customerId);

  for (const insight of insights) {
    const clusterId = generateClusterId(insight, customerId, 'cs');
    
    const savedChild = await InsightModel.findOneAndUpdate(
      {
        organizationId: orgObjId,
        customerId: custObjId,
        insightType: 'customer_success',
        clusterId: clusterId
      },
      {
        organizationId: orgObjId,
        customerId: custObjId,
        customerName: customerName,
        insightType: 'customer_success',
        clusterId: clusterId,
        issueDescription: insight.message,
        metadata: {
          type: insight.type,
          severity: insight.severity,
          category: insight.category,
          meta: { ...(insight.meta || {}), guidance: (() => {
            const base: any = {
              owner: 'CSM',
              slaDays: insight.severity === 'red' ? 2 : insight.severity === 'yellow' ? 5 : 7
            };
            switch (insight.type) {
              case 'activity_trend_decline':
                return {
                  summary: `User activity declined ${insight.meta?.declinePercent ?? 'significantly'} in the last period at ${customerName}.`,
                  why: 'Sustained activity decline is a leading indicator of churn risk and unmet value.',
                  signals: [
                    `Active users change: ${insight.meta?.activeUsersPrev ?? '-'} → ${insight.meta?.activeUsersCurr ?? '-'}`,
                    `Sessions change: ${insight.meta?.sessionsPrev ?? '-'} → ${insight.meta?.sessionsCurr ?? '-'}`
                  ],
                  actions: [
                    'Identify cohorts with the steepest decline (roles/teams) and contact champions.',
                    'Offer a 20-minute enablement focusing on top-value workflows used before the decline.',
                    'Set a 2-week follow-up to confirm recovery (target +15% WoW).'
                  ],
                  considerations: 'Coordinate with Support if there were incidents in the same period that may explain the decline.',
                  ...base
                };
              case 'feature_discovery':
                return {
                  summary: `Low discovery of key feature(s) impacting value realization at ${customerName}.`,
                  why: 'Under-used value drivers reduce perceived ROI and renewal likelihood.',
                  signals: [
                    `Features with <10% seat usage: ${(insight.meta?.featuresUnderused || []).join(', ') || 'N/A'}`
                  ],
                  actions: [
                    'Send a targeted how-to with short video to relevant roles.',
                    'Schedule an enablement session; include 2-3 customer-specific use cases.',
                    'Add in-app guide for the feature entry point.'
                  ],
                  considerations: 'Align messaging with the customer’s stated objectives from the success plan.',
                  ...base
                };
              case 'usage_pattern_anomaly':
                return {
                  summary: `Detected anomalous usage pattern requiring investigation at ${customerName}.`,
                  why: 'Anomalies can point to integration issues, user confusion, or adoption blockers.',
                  signals: [
                    `Anomaly score: ${insight.meta?.anomalyScore ?? '-'}`,
                    `Impacted workflow: ${insight.meta?.workflow ?? '-'}`
                  ],
                  actions: [
                    'Validate recent releases/incidents; check error logs and support tickets.',
                    'Interview 2 power users to understand friction; document steps.',
                    'Open follow-up task for product/ops if systemic.'
                  ],
                  considerations: 'If systemic, communicate mitigation timeline to the customer.',
                  ...base
                };
              case 'health_score_at_risk':
                return {
                  summary: `Customer health is at risk (overall score ${insight.meta?.healthScore?.overallScore ?? '-'}/100).`,
                  why: 'Composite leading indicators predict increased churn probability.',
                  signals: [
                    `Engagement: ${insight.meta?.engagementHealth ?? '-'}`,
                    `Support: ${insight.meta?.supportHealth ?? '-'}`,
                    `Business: ${insight.meta?.businessHealth ?? '-'}`
                  ],
                  actions: [
                    'Schedule a recovery plan call this week with sponsor and champion.',
                    'Agree on 3 measurable actions (owner, due date) to move score +10 within 30 days.',
                    'Increase cadence to weekly until recovery is sustained for 2 weeks.'
                  ],
                  considerations: 'Share a short value recap deck to re-anchor ROI.',
                  owner: 'CSM',
                  slaDays: 5
                };
              default:
                return {
                  summary: `Action recommended for ${String(insight.type).replace(/_/g,' ')} at ${customerName}.`,
                  why: 'Signal crossed an actionable threshold based on trends and benchmarks.',
                  actions: ['Review the signals and contact the stakeholder to define next steps.'],
                  ...base
                };
            }
          })(), sla: await resolveSLAForCustomer(String(organizationId), String(customerId), insight) }
        },
        assignee: insight.assignee ? new ObjectId(insight.assignee) : undefined,
        status: insight.status || 'new',
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    if (!savedChild.insightNumber) {
      await assignInsightNumberAtomic(savedChild._id as any);
    }
  }
}
