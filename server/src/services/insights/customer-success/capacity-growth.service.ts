import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';
import { ICustomer } from '../../../types/customer';

/**
 * Generate insights based on customer capacity and growth data
 */
export function generateCapacityGrowthInsights(customer: ICustomer): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!customer.capacityGrowth) {
    return insights;
  }

  const capacityGrowth = customer.capacityGrowth;
  const customerName = customer.name || 'Customer';

  // Generate insights for current limits
  insights.push(...generateCurrentLimitsInsights(capacityGrowth, customerName));
  
  // Generate insights for scaling plans
  insights.push(...generateScalingPlansInsights(capacityGrowth, customerName));
  
  // Generate insights for resource constraints
  insights.push(...generateResourceConstraintsInsights(capacityGrowth, customerName));

  console.log(`[Capacity Growth Insights] Generated ${insights.length} insights for ${customerName}`);
  return insights;
}

/**
 * Generate insights for current capacity limits
 */
function generateCurrentLimitsInsights(capacityGrowth: ICustomer['capacityGrowth'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!capacityGrowth?.currentLimits) {
    return insights;
  }

  const limits = capacityGrowth.currentLimits;

  // Storage utilization insights
  if (limits.storage?.limit && limits.storage?.current !== undefined) {
    const storageUtilization = (limits.storage.current / limits.storage.limit) * 100;
    const storageUnit = limits.storage.unit || 'GB';

    if (storageUtilization > 90) {
      insights.push({
        type: 'storage_capacity_critical',
        message: `Storage utilization at ${storageUtilization.toFixed(1)}% (${limits.storage.current}/${limits.storage.limit} ${storageUnit}) - immediate upgrade needed`,
        severity: 'red',
        category: 'capacity_risk',
        meta: {
          currentStorage: limits.storage.current,
          storageLimit: limits.storage.limit,
          storageUnit: storageUnit,
          utilization: storageUtilization.toFixed(1),
          availableSpace: limits.storage.limit - limits.storage.current
        },
        guidance: {
          summary: `Storage capacity is critically high and requires immediate attention`,
          whyItMatters: `Storage utilization above 90% can cause performance issues, data loss risk, and service disruptions. Immediate action is required.`,
          signals: [
            `Current usage: ${limits.storage.current} ${storageUnit}`,
            `Storage limit: ${limits.storage.limit} ${storageUnit}`,
            `Utilization: ${storageUtilization.toFixed(1)}%`,
            `Available space: ${limits.storage.limit - limits.storage.current} ${storageUnit}`
          ],
          recommendedActions: [
            'Contact customer immediately to discuss upgrade options',
            'Provide emergency storage expansion if available',
            'Review data retention policies and cleanup opportunities',
            'Implement storage monitoring and alerts',
            'Schedule upgrade meeting within 24 hours'
          ],
          investigationPath: [
            'Check for large files or unnecessary data',
            'Review data archiving opportunities',
            'Analyze storage growth trends',
            'Evaluate cleanup and optimization options'
          ],
          considerations: [
            'Customer may need immediate temporary storage',
            'Upgrade may require contract modification',
            'Data migration planning may be needed',
            'Performance impact during upgrade process'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Critical Storage Review', amount: 1, unit: 'days' }
        },
        evidence: {
          supportingData: {
            storageUtilization: `${storageUtilization.toFixed(1)}%`,
            currentUsage: `${limits.storage.current} ${storageUnit}`,
            capacityLimit: `${limits.storage.limit} ${storageUnit}`,
            availableSpace: `${limits.storage.limit - limits.storage.current} ${storageUnit}`,
            riskLevel: 'Critical'
          },
          relatedLinks: [
            { title: 'Storage Usage Dashboard', url: '/capacity/storage' },
            { title: 'Upgrade Options', url: '/pricing/upgrades' }
          ]
        }
      });
    } else if (storageUtilization > 75) {
      insights.push({
        type: 'storage_capacity_warning',
        message: `Storage utilization at ${storageUtilization.toFixed(1)}% - plan for upgrade`,
        severity: 'yellow',
        category: 'capacity_planning',
        meta: {
          currentStorage: limits.storage.current,
          storageLimit: limits.storage.limit,
          storageUnit: storageUnit,
          utilization: storageUtilization.toFixed(1),
          projectedFullDate: calculateProjectedFullDate(limits.storage.current, limits.storage.limit)
        },
        guidance: {
          summary: `Storage capacity approaching limits - proactive planning needed`,
          whyItMatters: `Storage utilization above 75% indicates approaching capacity limits. Proactive planning prevents service disruptions.`,
          recommendedActions: [
            'Schedule capacity planning discussion with customer',
            'Review storage growth trends and projections',
            'Present upgrade options and pricing',
            'Implement storage monitoring and alerts',
            'Plan upgrade timeline and implementation'
          ],
          investigationPath: [
            'Analyze storage usage patterns and growth trends',
            'Review data retention and cleanup opportunities',
            'Evaluate current storage efficiency',
            'Check for optimization opportunities'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Storage Planning Review', amount: 7, unit: 'days' }
        },
        evidence: {
          supportingData: {
            storageUtilization: `${storageUtilization.toFixed(1)}%`,
            currentUsage: `${limits.storage.current} ${storageUnit}`,
            capacityLimit: `${limits.storage.limit} ${storageUnit}`,
            projectedFullDate: calculateProjectedFullDate(limits.storage.current, limits.storage.limit)
          }
        }
      });
    }
  }

  // User limit insights
  if (limits.users?.limit && limits.users?.current !== undefined) {
    const userUtilization = (limits.users.current / limits.users.limit) * 100;

    if (userUtilization > 90) {
      insights.push({
        type: 'user_capacity_critical',
        message: `User capacity at ${userUtilization.toFixed(1)}% (${limits.users.current}/${limits.users.limit} users) - immediate upgrade needed`,
        severity: 'red',
        category: 'capacity_risk',
        meta: {
          currentUsers: limits.users.current,
          userLimit: limits.users.limit,
          utilization: userUtilization.toFixed(1),
          availableSeats: limits.users.limit - limits.users.current,
          projectedGrowth: limits.users.projectedGrowth
        },
        guidance: {
          summary: `User capacity is critically high - immediate action required`,
          whyItMatters: `User capacity above 90% prevents new user onboarding and can impact business operations. Immediate upgrade is necessary.`,
          recommendedActions: [
            'Contact customer immediately about user limit upgrade',
            'Provide emergency seat expansion if possible',
            'Review user access and inactive accounts',
            'Schedule urgent upgrade discussion',
            'Implement user monitoring and alerts'
          ],
          investigationPath: [
            'Check for inactive or duplicate user accounts',
            'Review user access patterns and usage',
            'Analyze projected growth vs current capacity',
            'Evaluate user management optimization'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Critical User Capacity Review', amount: 1, unit: 'days' }
        },
        evidence: {
          supportingData: {
            userUtilization: `${userUtilization.toFixed(1)}%`,
            currentUsers: limits.users.current,
            userLimit: limits.users.limit,
            availableSeats: limits.users.limit - limits.users.current,
            projectedGrowth: limits.users.projectedGrowth ? `${limits.users.projectedGrowth}%` : 'Not specified'
          }
        }
      });
    } else if (userUtilization > 75 && limits.users.projectedGrowth && limits.users.projectedGrowth > 20) {
      insights.push({
        type: 'user_growth_planning',
        message: `User capacity at ${userUtilization.toFixed(1)}% with ${limits.users.projectedGrowth}% projected growth - plan upgrade`,
        severity: 'yellow',
        category: 'capacity_planning',
        meta: {
          currentUsers: limits.users.current,
          userLimit: limits.users.limit,
          utilization: userUtilization.toFixed(1),
          projectedGrowth: limits.users.projectedGrowth,
          projectedUsers: Math.round(limits.users.current * (1 + limits.users.projectedGrowth / 100))
        },
        guidance: {
          summary: `High projected user growth requires proactive capacity planning`,
          whyItMatters: `With ${limits.users.projectedGrowth}% projected growth, current capacity will be exceeded soon. Proactive planning prevents capacity issues.`,
          recommendedActions: [
            'Schedule growth planning meeting with customer',
            'Calculate required capacity for projected growth',
            'Present upgrade options and timeline',
            'Plan for growth milestone triggers',
            'Implement growth monitoring and alerts'
          ],
          investigationPath: [
            'Validate growth projections with customer',
            'Review historical growth patterns',
            'Analyze business expansion plans',
            'Evaluate current user utilization efficiency'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Growth Planning Review', amount: 14, unit: 'days' }
        },
        evidence: {
          supportingData: {
            currentUtilization: `${userUtilization.toFixed(1)}%`,
            projectedGrowth: `${limits.users.projectedGrowth}%`,
            projectedUsers: Math.round(limits.users.current * (1 + limits.users.projectedGrowth / 100)),
            growthTimeline: 'Next 6-12 months'
          }
        }
      });
    }
  }

  // Transaction limit insights
  if (limits.transactions?.limit && limits.transactions?.current !== undefined) {
    const transactionUtilization = (limits.transactions.current / limits.transactions.limit) * 100;

    if (transactionUtilization > 85) {
      insights.push({
        type: 'transaction_capacity_warning',
        message: `Transaction usage at ${transactionUtilization.toFixed(1)}% (${limits.transactions.current}/${limits.transactions.limit}/month)`,
        severity: 'yellow',
        category: 'capacity_planning',
        meta: {
          currentTransactions: limits.transactions.current,
          transactionLimit: limits.transactions.limit,
          utilization: transactionUtilization.toFixed(1),
          peakUsage: limits.transactions.peakUsage,
          availableTransactions: limits.transactions.limit - limits.transactions.current
        },
        guidance: {
          summary: `Transaction capacity approaching limits`,
          whyItMatters: `High transaction utilization can impact system performance and user experience. Planning prevents service degradation.`,
          recommendedActions: [
            'Monitor transaction patterns and peak usage',
            'Review transaction optimization opportunities',
            'Plan for capacity upgrade if needed',
            'Implement transaction monitoring and alerts',
            'Discuss usage optimization with customer'
          ],
          investigationPath: [
            'Analyze transaction patterns and peak usage times',
            'Review transaction efficiency and optimization',
            'Check for unnecessary or duplicate transactions',
            'Evaluate usage patterns and growth trends'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Transaction Capacity Review', amount: 7, unit: 'days' }
        },
        evidence: {
          supportingData: {
            transactionUtilization: `${transactionUtilization.toFixed(1)}%`,
            currentTransactions: limits.transactions.current,
            transactionLimit: limits.transactions.limit,
            peakUsage: limits.transactions.peakUsage || 'Not specified'
          }
        }
      });
    }
  }

  // API call limit insights
  if (limits.apiCalls?.limit && limits.apiCalls?.current !== undefined) {
    const apiUtilization = (limits.apiCalls.current / limits.apiCalls.limit) * 100;

    if (apiUtilization > 80 && limits.apiCalls.projectedGrowth && limits.apiCalls.projectedGrowth > 30) {
      insights.push({
        type: 'api_capacity_growth_planning',
        message: `API usage at ${apiUtilization.toFixed(1)}% with ${limits.apiCalls.projectedGrowth}% projected growth`,
        severity: 'yellow',
        category: 'capacity_planning',
        meta: {
          currentApiCalls: limits.apiCalls.current,
          apiCallLimit: limits.apiCalls.limit,
          utilization: apiUtilization.toFixed(1),
          projectedGrowth: limits.apiCalls.projectedGrowth
        },
        guidance: {
          summary: `API capacity requires growth planning`,
          whyItMatters: `High API utilization with significant projected growth indicates capacity planning needs to prevent service limitations.`,
          recommendedActions: [
            'Analyze API usage patterns and efficiency',
            'Plan for capacity expansion',
            'Review API optimization opportunities',
            'Implement API usage monitoring',
            'Schedule capacity planning discussion'
          ],
          investigationPath: [
            'Review API usage patterns and efficiency',
            'Analyze projected growth drivers',
            'Evaluate API optimization opportunities',
            'Check for unnecessary or inefficient API calls'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'API Capacity Planning', amount: 14, unit: 'days' }
        },
        evidence: {
          supportingData: {
            apiUtilization: `${apiUtilization.toFixed(1)}%`,
            projectedGrowth: `${limits.apiCalls.projectedGrowth}%`,
            currentApiCalls: limits.apiCalls.current,
            apiCallLimit: limits.apiCalls.limit
          }
        }
      });
    }
  }

  return insights;
}

/**
 * Generate insights for scaling plans
 */
function generateScalingPlansInsights(capacityGrowth: ICustomer['capacityGrowth'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!capacityGrowth?.scalingPlans) {
    return insights;
  }

  const scalingPlans = capacityGrowth.scalingPlans;

  // Next upgrade insights
  if (scalingPlans.nextUpgrade?.plannedDate) {
    const plannedDate = new Date(scalingPlans.nextUpgrade.plannedDate);
    const now = new Date();
    const daysUntilUpgrade = Math.ceil((plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilUpgrade <= 30 && daysUntilUpgrade > 0) {
      insights.push({
        type: 'upgrade_approaching',
        message: `Planned upgrade (${scalingPlans.nextUpgrade.upgradeType}) scheduled in ${daysUntilUpgrade} days`,
        severity: 'info',
        category: 'capacity_planning',
        meta: {
          plannedDate: scalingPlans.nextUpgrade.plannedDate,
          daysUntilUpgrade: daysUntilUpgrade,
          upgradeType: scalingPlans.nextUpgrade.upgradeType,
          triggerMetric: scalingPlans.nextUpgrade.triggerMetric,
          triggerThreshold: scalingPlans.nextUpgrade.triggerThreshold
        },
        guidance: {
          summary: `Customer upgrade is approaching - prepare for implementation`,
          whyItMatters: `Upcoming upgrades require preparation to ensure smooth implementation and minimize disruption.`,
          recommendedActions: [
            'Schedule pre-upgrade planning meeting',
            'Review upgrade requirements and timeline',
            'Prepare implementation plan and resources',
            'Communicate upgrade timeline to stakeholders',
            'Set up upgrade monitoring and support'
          ],
          investigationPath: [
            'Review upgrade scope and requirements',
            'Check current system status and dependencies',
            'Validate upgrade readiness and prerequisites',
            'Plan for rollback procedures if needed'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Upgrade Preparation', amount: 7, unit: 'days' }
        },
        evidence: {
          supportingData: {
            plannedDate: scalingPlans.nextUpgrade.plannedDate,
            daysUntilUpgrade: daysUntilUpgrade,
            upgradeType: scalingPlans.nextUpgrade.upgradeType,
            triggerMetric: scalingPlans.nextUpgrade.triggerMetric,
            triggerThreshold: scalingPlans.nextUpgrade.triggerThreshold
          }
        }
      });
    } else if (daysUntilUpgrade <= 0) {
      insights.push({
        type: 'upgrade_overdue',
        message: `Planned upgrade (${scalingPlans.nextUpgrade.upgradeType}) is overdue by ${Math.abs(daysUntilUpgrade)} days`,
        severity: 'red',
        category: 'capacity_risk',
        meta: {
          plannedDate: scalingPlans.nextUpgrade.plannedDate,
          daysOverdue: Math.abs(daysUntilUpgrade),
          upgradeType: scalingPlans.nextUpgrade.upgradeType,
          triggerMetric: scalingPlans.nextUpgrade.triggerMetric,
          triggerThreshold: scalingPlans.nextUpgrade.triggerThreshold
        },
        guidance: {
          summary: `Customer upgrade is overdue - immediate action required`,
          whyItMatters: `Overdue upgrades indicate potential capacity constraints or implementation delays that need immediate attention.`,
          recommendedActions: [
            'Contact customer immediately about upgrade status',
            'Reschedule upgrade implementation',
            'Assess current capacity constraints',
            'Provide temporary solutions if needed',
            'Escalate to account manager if necessary'
          ],
          owner: 'Customer Success Manager',
          sla: { name: 'Overdue Upgrade Review', amount: 1, unit: 'days' }
        },
        evidence: {
          supportingData: {
            plannedDate: scalingPlans.nextUpgrade.plannedDate,
            daysOverdue: Math.abs(daysUntilUpgrade),
            upgradeType: scalingPlans.nextUpgrade.upgradeType
          }
        }
      });
    }
  }

  // Growth projections insights
  if (scalingPlans.growthProjections && scalingPlans.growthProjections.length > 0) {
    scalingPlans.growthProjections.forEach((projection, index) => {
      if (!projection.metric || projection.currentValue === undefined || projection.projectedValue === undefined) {
        return;
      }

      const growthRate = ((projection.projectedValue - projection.currentValue) / projection.currentValue) * 100;
      const confidence = projection.confidence || 'medium';

      if (growthRate > 100 && confidence === 'high') {
        insights.push({
          type: 'significant_growth_projection',
          message: `High-confidence projection: ${projection.metric} to grow ${growthRate.toFixed(0)}% in ${projection.timeframe}`,
          severity: 'info',
          category: 'opportunity',
          meta: {
            metric: projection.metric,
            currentValue: projection.currentValue,
            projectedValue: projection.projectedValue,
            growthRate: growthRate.toFixed(0),
            timeframe: projection.timeframe,
            confidence: confidence
          },
          guidance: {
            summary: `Significant growth projected for ${projection.metric}`,
            whyItMatters: `High-confidence growth projections create opportunities for capacity planning, expansion discussions, and success planning.`,
            recommendedActions: [
              'Validate growth assumptions with customer',
              'Plan capacity expansion to support growth',
              'Identify growth drivers and success factors',
              'Prepare for expansion discussions',
              'Monitor progress toward projections'
            ],
            investigationPath: [
              'Review growth assumptions and drivers',
              'Analyze historical growth patterns',
              'Validate projection methodology',
              'Check for external factors affecting growth'
            ],
            owner: 'Customer Success Manager',
            sla: { name: 'Growth Planning Review', amount: 14, unit: 'days' }
          },
          evidence: {
            supportingData: {
              metric: projection.metric,
              growthRate: `${growthRate.toFixed(0)}%`,
              timeframe: projection.timeframe,
              confidence: confidence,
              currentValue: projection.currentValue,
              projectedValue: projection.projectedValue
            }
          }
        });
      }
    });
  }

  return insights;
}

/**
 * Generate insights for resource constraints
 */
function generateResourceConstraintsInsights(capacityGrowth: ICustomer['capacityGrowth'], customerName: string): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!capacityGrowth?.resourceConstraints || capacityGrowth.resourceConstraints.length === 0) {
    return insights;
  }

  capacityGrowth.resourceConstraints.forEach((constraint, index) => {
    if (!constraint.type || !constraint.description) {
      return;
    }

    const impact = constraint.impact || 'medium';
    const severity = impact === 'high' ? 'red' : impact === 'medium' ? 'yellow' : 'info';

    // Check if constraint has resolution timeline
    if (constraint.resolutionTimeline) {
      const resolutionDate = new Date(constraint.resolutionTimeline);
      const now = new Date();
      const daysUntilResolution = Math.ceil((resolutionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilResolution <= 30 && daysUntilResolution > 0) {
        insights.push({
          type: 'constraint_resolution_approaching',
          message: `${constraint.type.charAt(0).toUpperCase() + constraint.type.slice(1)} constraint resolution planned in ${daysUntilResolution} days`,
          severity: severity as any,
          category: 'resource_management',
          meta: {
            constraintType: constraint.type,
            description: constraint.description,
            impact: constraint.impact,
            daysUntilResolution: daysUntilResolution,
            resolutionTimeline: constraint.resolutionTimeline
          },
          guidance: {
            summary: `Resource constraint resolution is approaching`,
            whyItMatters: `Constraint resolution can unlock growth opportunities and improve customer success outcomes.`,
            recommendedActions: [
              'Monitor constraint resolution progress',
              'Prepare for post-resolution opportunities',
              'Plan capacity utilization after resolution',
              'Identify expansion opportunities',
              'Schedule post-resolution review'
            ],
            owner: 'Customer Success Manager',
            sla: { name: 'Constraint Resolution Review', amount: 7, unit: 'days' }
          },
          evidence: {
            supportingData: {
              constraintType: constraint.type,
              impact: constraint.impact,
              daysUntilResolution: daysUntilResolution,
              resolutionTimeline: constraint.resolutionTimeline
            }
          }
        });
      }
    } else {
      // No resolution timeline - ongoing constraint
      if (impact === 'high') {
        insights.push({
          type: 'ongoing_high_impact_constraint',
          message: `High-impact ${constraint.type} constraint: ${constraint.description}`,
          severity: 'red',
          category: 'resource_management',
          meta: {
            constraintType: constraint.type,
            description: constraint.description,
            impact: constraint.impact
          },
          guidance: {
            summary: `High-impact resource constraint requires attention`,
            whyItMatters: `High-impact constraints significantly limit customer success and growth potential. Active management is required.`,
            recommendedActions: [
              'Schedule constraint management discussion',
              'Explore alternative solutions or workarounds',
              'Identify constraint mitigation strategies',
              'Plan for constraint impact on growth',
              'Escalate to appropriate stakeholders'
            ],
            investigationPath: [
              'Assess constraint impact on customer success',
              'Explore alternative approaches or solutions',
              'Evaluate constraint timeline and evolution',
              'Check for external factors affecting constraint'
            ],
            owner: 'Customer Success Manager',
            sla: { name: 'High Impact Constraint Review', amount: 5, unit: 'days' }
          },
          evidence: {
            supportingData: {
              constraintType: constraint.type,
              impact: constraint.impact,
              description: constraint.description,
              status: 'Ongoing'
            }
          }
        });
      }
    }
  });

  return insights;
}

/**
 * Helper function to calculate projected full date based on current usage and limits
 */
function calculateProjectedFullDate(current: number, limit: number): string {
  // Simple linear projection - assumes current growth rate continues
  const utilization = current / limit;
  const remainingCapacity = limit - current;
  
  if (utilization < 0.5) {
    return '6+ months';
  } else if (utilization < 0.75) {
    return '3-6 months';
  } else if (utilization < 0.9) {
    return '1-3 months';
  } else {
    return 'Less than 1 month';
  }
}
