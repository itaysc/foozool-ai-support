import { UserContextManager } from 'src/context/userContext';
import mongoose from 'mongoose';
import { CustomerModel, CustomerActivityModel } from '../../schemas';
import { generateTicketInsights, TicketInsight } from './ticketInsights.service';

export interface CustomerSuccessInsight {
  type: 'declining_activity' | 'inactive_customer' | 'low_utilization' | 'one_solution_dependency' | 
        'high_utilization' | 'solution_gap' | 'increasing_usage' | 'top_solution' | 'adoption_milestones' | 
        'seasonality' | 'correlation_to_value' | 'renewal_warning' |
        'high_ticket_volume' | 'escalating_issues' | 'sentiment_decline' | 'recurring_problems' | 
        'resolution_delays' | 'support_patterns' | 'urgent_trends' | 'positive_feedback' | 
        'technical_debt' | 'user_experience_issues' | 'integration_problems' | 'performance_concerns';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic';
  meta?: Record<string, any>;
}

export async function generateCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsight[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  console.log(`[CS Insights] ▶️ start | org=${organizationId} customer=${customerId}`);
  const insights: CustomerSuccessInsight[] = [];
  const now = new Date();
  
  // Ensure ObjectId matching for CustomerActivity
  const orgObjId = mongoose.Types.ObjectId.isValid(String(organizationId))
    ? new mongoose.Types.ObjectId(String(organizationId))
    : undefined;
  const custObjId = mongoose.Types.ObjectId.isValid(String(customerId))
    ? new mongoose.Types.ObjectId(String(customerId))
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
  insights.push(...generateRiskAlerts(activities, customerName, last30Start, prev30Start, last60Start));
  insights.push(...generateUpsellOpportunities(activities, orgActivities, customerName));
  insights.push(...generateCustomerSuccessPrep(activities, customerName));
  insights.push(...generateStrategicInsights(activities, customerName));

  // 3. Generate Ticket Insights
  try {
    console.log(`[CS Insights] 🎫 generating ticket insights for customer ${customerId}`);
    const ticketInsights = await generateTicketInsights(customerId);
    insights.push(...ticketInsights);
    console.log(`[CS Insights] ✅ added ${ticketInsights.length} ticket insights`);
  } catch (error) {
    console.error(`[CS Insights] ❌ failed to generate ticket insights:`, error);
  }

  // Logging summary
  const breakdown = insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  console.log(`[CS Insights] ✅ done | total=${insights.length} | breakdown=${JSON.stringify(breakdown)}`);

  return insights;
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

  // 1. Seasonality Patterns (simplified)
  const monthlyGroups = new Map<string, any[]>();
  for (const activity of activities) {
    if (activity.activityDate) {
      const month = new Date(activity.activityDate).toISOString().substring(0, 7);
      if (!monthlyGroups.has(month)) {
        monthlyGroups.set(month, []);
      }
      monthlyGroups.get(month)!.push(activity);
    }
  }

  if (monthlyGroups.size >= 3) {
    insights.push({
      type: 'seasonality',
      message: 'Activity patterns show seasonal variations - consider this in planning',
      severity: 'info',
      category: 'strategic',
      meta: { seasonalityPattern: 'Monthly variations detected' }
    });
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


