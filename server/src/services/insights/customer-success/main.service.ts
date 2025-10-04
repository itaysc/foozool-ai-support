import { UserContextManager } from '../../../context/userContext';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import { CustomerModel, CustomerActivityModel } from '../../../schemas';
import { InsightModel } from '../../../schemas/insights.schema';
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
      type: insight.metadata?.type as CustomerSuccessInsight['type'],
      message: insight.issueDescription,
      severity: insight.metadata?.severity as CustomerSuccessInsight['severity'],
      category: insight.metadata?.category as CustomerSuccessInsight['category'],
      meta: insight.metadata?.meta || {}
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
      type: insight.metadata?.type as CustomerSuccessInsight['type'],
      message: insight.issueDescription,
      severity: insight.metadata?.severity as CustomerSuccessInsight['severity'],
      category: insight.metadata?.category as CustomerSuccessInsight['category'],
      meta: insight.metadata?.meta || {}
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
 * Persist stakeholder insights to database
 */
async function persistStakeholderInsights(organizationId: string, customerId: string, customerName: string, insights: CustomerSuccessInsight[]): Promise<void> {
  const orgObjId = new ObjectId(organizationId);
  const custObjId = new ObjectId(customerId);

  for (const insight of insights) {
    const clusterId = `stakeholder:${crypto.randomBytes(8).toString('hex')}`;
    
    await InsightModel.findOneAndUpdate(
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
          meta: insight.meta
        },
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
}

/**
 * Persist customer success insights to database
 */
async function persistCustomerSuccessInsights(organizationId: string, customerId: string, customerName: string, insights: CustomerSuccessInsight[]): Promise<void> {
  const orgObjId = new ObjectId(organizationId);
  const custObjId = new ObjectId(customerId);

  for (const insight of insights) {
    const clusterId = `cs:${crypto.randomBytes(8).toString('hex')}`;
    
    await InsightModel.findOneAndUpdate(
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
          meta: insight.meta
        },
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
}
