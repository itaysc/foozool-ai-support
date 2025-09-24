import { UserContextManager } from 'src/context/userContext';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { CustomerModel, CustomerActivityModel } from '../../schemas';
import { InsightModel } from '../../schemas/insights.schema';
import { generateTicketInsights, TicketInsight } from './ticketInsights.service';
import { generateStakeholderInsights as generateStakeholderInsightsFromModule } from './stakeholders';
import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';

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
    // Fetch all customer success insights (both stakeholder and other insights)
    const savedInsights = await InsightModel.find({
      organizationId: orgObjId,
      customerId: custObjId,
      insightType: 'customer_success',
    }).sort({ lastUpdatedAt: -1 }).lean();

    return savedInsights.map(insight => ({
      type: insight.metadata?.type as CustomerSuccessInsight['type'],
      message: insight.issueDescription,
      severity: insight.metadata?.severity as CustomerSuccessInsight['severity'],
      category: insight.metadata?.category as CustomerSuccessInsight['category'],
      meta: insight.metadata?.meta || {}
    }));
  } catch (error) {
    console.error('[CS Insights] ❌ failed to fetch saved customer success insights:', error);
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
  console.log(`[CS Insights] 👤 customer | name=${customerName}`);

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
  const allInsights = [
    ...riskInsights,
    ...upsellInsights,
    ...successPrepInsights,
    ...strategicInsights,
    ...stakeholderInsights,
    ...ticketInsights
  ];

  // Logging summary
  const breakdown = allInsights.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  console.log(`[CS Insights] ✅ done | total=${allInsights.length} | breakdown=${JSON.stringify(breakdown)}`);

  return allInsights;
}

/**
 * Persist all customer success insights into the generic InsightModel using type 'customer_success'.
 * Uses deterministic clusterId to deduplicate per (org, customer, insight type, meta signature) per month.
 */
async function persistCustomerSuccessInsights(
  organizationId: string | typeof ObjectId | undefined,
  customerId: string,
  customerName: string,
  insights: CustomerSuccessInsight[]
): Promise<void> {
  if (!organizationId) return;

  const orgObjId = ObjectId.isValid(String(organizationId))
    ? new ObjectId(String(organizationId))
    : undefined;
  const custObjId = ObjectId.isValid(String(customerId))
    ? new ObjectId(String(customerId))
    : undefined;
  if (!orgObjId || !custObjId) return;

  const now = new Date();
  const monthKey = now.toISOString().substring(0, 7); // YYYY-MM to limit duplicates monthly

  // Upsert each insight
  for (const insight of insights) {
    const metaSignature = crypto
      .createHash('sha1')
      .update(JSON.stringify(insight.meta || {}))
      .digest('hex')
      .substring(0, 12);

    const clusterId = `cs:${orgObjId.toString()}:${custObjId.toString()}:${insight.type}:${monthKey}:${metaSignature}`;

    await InsightModel.findOneAndUpdate(
      { clusterId },
      {
        $setOnInsert: {
          firstDetectedAt: now,
        },
        $set: {
          organizationId: orgObjId,
          insightType: 'customer_success',
          issueDescription: insight.message,
          // For customer_success insights, we populate neutral numeric fields
          ticketVolume: 0,
          growthRate: 0,
          lastUpdatedAt: now,
          customerId: custObjId,
          customerName,
          metadata: {
            type: insight.type,
            severity: insight.severity,
            category: insight.category,
            meta: insight.meta || {},
          },
        },
      },
      { upsert: true, new: true }
    );
  }
}

/**
 * Persist stakeholder insights separately with their own clusterId pattern
 */
async function persistStakeholderInsights(
  organizationId: string | typeof ObjectId | undefined,
  customerId: string,
  customerName: string,
  stakeholderInsights: CustomerSuccessInsight[]
): Promise<void> {
  if (!organizationId) return;

  const orgObjId = ObjectId.isValid(String(organizationId))
    ? new ObjectId(String(organizationId))
    : undefined;
  const custObjId = ObjectId.isValid(String(customerId))
    ? new ObjectId(String(customerId))
    : undefined;
  if (!orgObjId || !custObjId) return;

  const now = new Date();
  const monthKey = now.toISOString().substring(0, 7); // YYYY-MM to limit duplicates monthly

  // Upsert each stakeholder insight with 'stakeholder' prefix in clusterId
  for (const insight of stakeholderInsights) {
    const metaSignature = crypto
      .createHash('sha1')
      .update(JSON.stringify(insight.meta || {}))
      .digest('hex')
      .substring(0, 12);

    const clusterId = `stakeholder:${orgObjId.toString()}:${custObjId.toString()}:${insight.type}:${monthKey}:${metaSignature}`;

    await InsightModel.findOneAndUpdate(
      { clusterId },
      {
        $setOnInsert: {
          firstDetectedAt: now,
        },
        $set: {
          organizationId: orgObjId,
          insightType: 'customer_success',
          issueDescription: insight.message,
          // For customer_success insights, we populate neutral numeric fields
          ticketVolume: 0,
          growthRate: 0,
          lastUpdatedAt: now,
          customerId: custObjId,
          customerName,
          metadata: {
            type: insight.type,
            severity: insight.severity,
            category: insight.category,
            meta: insight.meta || {},
            source: 'stakeholder' // Mark as stakeholder insight
          },
        },
      },
      { upsert: true, new: true }
    );
  }
}

function generateRiskAlerts(activities: any[], customerName: string, last30Start: Date, prev30Start: Date, last60Start: Date): CustomerSuccessInsight[] {
  const alerts: CustomerSuccessInsight[] = [];
  const now = new Date();

  // 1. Declining Activity
  const recentActivities = activities.filter(a => 
    a.activityDate && new Date(a.activityDate) >= last30Start
  );
  const olderActivities = activities.filter(a => 
    a.activityDate && new Date(a.activityDate) >= prev30Start && new Date(a.activityDate) < last30Start
  );

  const solutionGroups = groupActivitiesBySolution(recentActivities);
  const previousSolutionGroups = groupActivitiesBySolution(olderActivities);

  for (const [solutionName, currentActivities] of solutionGroups) {
    const previousActivities = previousSolutionGroups.get(solutionName) || [];
    
    if (previousActivities.length > 0) {
      const currentAvg = calculateAverageMetricValue(currentActivities);
      const previousAvg = calculateAverageMetricValue(previousActivities);
      
      if (currentAvg > 0 && previousAvg > 0) {
        const declinePercent = ((previousAvg - currentAvg) / previousAvg) * 100;
        
        if (declinePercent > 20) {
          alerts.push({
            type: 'declining_activity',
            message: `${solutionName} usage down ${declinePercent.toFixed(1)}% this period`,
            severity: declinePercent > 40 ? 'red' : declinePercent > 25 ? 'yellow' : 'info',
            category: 'risk',
            meta: { solutionName, currentValue: currentAvg, previousValue: previousAvg, declinePercent }
          });
        }
      }
    }
  }

  // 2. Inactive Customer
  const lastActivity = activities.find(a => a.activityDate);
  if (lastActivity) {
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - new Date(lastActivity.activityDate).getTime()) / (24 * 60 * 60 * 1000)
    );
    
    if (daysSinceLastActivity > 30) {
      alerts.push({
        type: 'inactive_customer',
        message: `No activity for ${daysSinceLastActivity} days`,
        severity: daysSinceLastActivity > 60 ? 'red' : 'yellow',
        category: 'risk',
        meta: { daysInactive: daysSinceLastActivity }
      });
    }
  } else {
    alerts.push({
      type: 'inactive_customer',
      message: 'No activity recorded',
      severity: 'red',
      category: 'risk',
      meta: { daysInactive: 999 }
    });
  }

  // 3. Low Utilization
  const percentageActivities = activities.filter(a => a.metricType === 'percentage');
  for (const activity of percentageActivities) {
    if (activity.metricValue < 30) {
      alerts.push({
        type: 'low_utilization',
        message: `Only ${activity.metricValue}% utilization in ${activity.solutionName}`,
        severity: activity.metricValue < 15 ? 'red' : activity.metricValue < 25 ? 'yellow' : 'info',
        category: 'risk',
        meta: { solutionName: activity.solutionName, currentValue: activity.metricValue, threshold: 30 }
      });
    }
  }

  // 4. One-Solution Dependency
  const uniqueSolutions = new Set(activities.map(a => a.solutionName));
  if (uniqueSolutions.size === 1 && activities.length > 0) {
    alerts.push({
      type: 'one_solution_dependency',
      message: `Customer only uses ${Array.from(uniqueSolutions)[0]}`,
      severity: 'yellow',
      category: 'risk',
      meta: { solutionName: Array.from(uniqueSolutions)[0] }
    });
  }

  return alerts;
}

function generateUpsellOpportunities(activities: any[], orgActivities: any[], customerName: string): CustomerSuccessInsight[] {
  const opportunities: CustomerSuccessInsight[] = [];

  // 1. High Utilization / Capacity Limit
  const percentageActivities = activities.filter(a => a.metricType === 'percentage');
  for (const activity of percentageActivities) {
    if (activity.metricValue > 85) {
      opportunities.push({
        type: 'high_utilization',
        message: `${activity.solutionName} at ${activity.metricValue}% utilization - consider capacity upgrade`,
        severity: activity.metricValue > 95 ? 'red' : 'yellow',
        category: 'upsell',
        meta: { solutionName: activity.solutionName, utilizationPercent: activity.metricValue }
      });
    }
  }

  // 2. Solution Gap vs. Peers
  const customerSolutions = new Set(activities.map(a => a.solutionName));
  const allSolutions = new Set(orgActivities.map(a => a.solutionName));
  const missingSolutions = Array.from(allSolutions).filter(s => !customerSolutions.has(s));
  
  if (missingSolutions.length > 0) {
    opportunities.push({
      type: 'solution_gap',
      message: `Customer missing ${missingSolutions.length} solutions used by peers`,
      severity: 'info',
      category: 'upsell',
      meta: { missingSolutions: missingSolutions.slice(0, 3) }
    });
  }

  // 3. Increasing Usage Trend
  const solutionGroups = groupActivitiesBySolution(activities);
  for (const [solutionName, solutionActivities] of solutionGroups) {
    if (solutionActivities.length >= 3) {
      const sortedActivities = solutionActivities.sort((a, b) => 
        new Date(a.activityDate || a.createdAt).getTime() - new Date(b.activityDate || b.createdAt).getTime()
      );
      
      const recent = sortedActivities.slice(-3);
      const older = sortedActivities.slice(-6, -3);
      
      if (older.length > 0) {
        const recentAvg = calculateAverageMetricValue(recent);
        const olderAvg = calculateAverageMetricValue(older);
        
        if (recentAvg > olderAvg) {
          const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;
          if (growthRate > 15) {
            opportunities.push({
              type: 'increasing_usage',
              message: `${solutionName} usage up ${growthRate.toFixed(1)}%`,
              severity: growthRate > 30 ? 'yellow' : 'info',
              category: 'upsell',
              meta: { solutionName, growthRate }
            });
          }
        }
      }
    }
  }

  return opportunities;
}

function generateCustomerSuccessPrep(activities: any[], customerName: string): CustomerSuccessInsight[] {
  const prep: CustomerSuccessInsight[] = [];

  // 1. Top Solution for Account
  const solutionGroups = groupActivitiesBySolution(activities);
  const solutionTotals = new Map<string, number>();
  
  for (const [solutionName, solutionActivities] of solutionGroups) {
    const total = solutionActivities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
    solutionTotals.set(solutionName, total);
  }

  if (solutionTotals.size > 0) {
    const topSolution = Array.from(solutionTotals.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    prep.push({
      type: 'top_solution',
      message: `Customer primarily uses ${topSolution[0]} - focus CSM discussions on this`,
      severity: 'info',
      category: 'customer_success',
      meta: { solutionName: topSolution[0] }
    });
  }

  // 2. Adoption Milestones
  const uniqueSolutions = new Set(activities.map(a => a.solutionName));
  const totalSolutions = uniqueSolutions.size;
  const expectedSolutions = 5; // Placeholder - should be configurable
  const adoptionRate = (totalSolutions / expectedSolutions) * 100;
  
  prep.push({
    type: 'adoption_milestones',
    message: `Customer adopted ${totalSolutions}/${expectedSolutions} solutions (${adoptionRate.toFixed(1)}%)`,
    severity: 'info',
    category: 'customer_success',
    meta: { adoptionRate, totalSolutions: expectedSolutions, adoptedSolutions: totalSolutions }
  });

  return prep;
}

function generateStrategicInsights(activities: any[], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];

  // 1. Seasonality Patterns Analysis
  const monthlyGroups = new Map<string, any[]>();
  const monthlyTotals = new Map<string, number>();
  
  for (const activity of activities) {
    if (activity.activityDate) {
      const month = new Date(activity.activityDate).toISOString().substring(0, 7);
      if (!monthlyGroups.has(month)) {
        monthlyGroups.set(month, []);
        monthlyTotals.set(month, 0);
      }
      monthlyGroups.get(month)!.push(activity);
      monthlyTotals.set(month, monthlyTotals.get(month)! + activity.metricValue);
    }
  }

  if (monthlyGroups.size >= 3) {
    // Analyze seasonal patterns
    const sortedMonths = Array.from(monthlyTotals.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const values = sortedMonths.map(([_, value]) => value);
    const avgActivity = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Find peak and low months
    const maxMonth = sortedMonths.reduce((max, current) => 
      monthlyTotals.get(current[0])! > monthlyTotals.get(max[0])! ? current : max
    );
    const minMonth = sortedMonths.reduce((min, current) => 
      monthlyTotals.get(current[0])! < monthlyTotals.get(min[0])! ? current : min
    );
    
    const peakValue = monthlyTotals.get(maxMonth[0])!;
    const lowValue = monthlyTotals.get(minMonth[0])!;
    const variationPercent = avgActivity > 0 ? Math.round(((peakValue - lowValue) / avgActivity) * 100) : 0;
    
    // Generate specific insights based on patterns
    if (variationPercent > 50) {
      const peakMonthName = new Date(maxMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long' });
      const lowMonthName = new Date(minMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long' });
      
      insights.push({
        type: 'seasonality',
        message: `Strong seasonal pattern detected: ${peakMonthName} is ${Math.round(peakValue/lowValue)}x more active than ${lowMonthName}. Plan engagement accordingly.`,
        severity: 'info',
        category: 'strategic',
        meta: { 
          seasonalityPattern: 'High variation detected',
          peakMonth: peakMonthName,
          lowMonth: lowMonthName,
          variationPercent,
          peakValue,
          lowValue,
          recommendation: 'Schedule major initiatives during peak months, use low months for planning and training'
        }
      });
    } else if (variationPercent > 25) {
      insights.push({
        type: 'seasonality',
        message: `Moderate seasonal variations detected (${variationPercent}% difference). Monitor patterns for optimal engagement timing.`,
        severity: 'info',
        category: 'strategic',
        meta: { 
          seasonalityPattern: 'Moderate variation detected',
          variationPercent,
          recommendation: 'Track monthly patterns to identify best times for feature launches and customer outreach'
        }
      });
    } else {
      insights.push({
        type: 'seasonality',
        message: `Consistent activity patterns across months. Customer maintains steady engagement throughout the year.`,
        severity: 'info',
        category: 'strategic',
        meta: { 
          seasonalityPattern: 'Consistent activity',
          variationPercent,
          recommendation: 'Customer is reliable year-round - focus on growth initiatives rather than seasonal adjustments'
        }
      });
    }
  }

  // 2. Early Warning for Renewal (placeholder)
  insights.push({
    type: 'renewal_warning',
    message: 'Monitor activity trends as renewal approaches',
    severity: 'info',
    category: 'strategic',
    meta: { renewalRisk: 'medium', daysToRenewal: 90 }
  });

  return insights;
}

function groupActivitiesBySolution(activities: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const activity of activities) {
    if (!groups.has(activity.solutionName)) {
      groups.set(activity.solutionName, []);
    }
    groups.get(activity.solutionName)!.push(activity);
  }
  return groups;
}

function calculateAverageMetricValue(activities: any[]): number {
  if (activities.length === 0) return 0;
  const total = activities.reduce((sum, a) => sum + (a.metricValue || 0), 0);
  return total / activities.length;
}



