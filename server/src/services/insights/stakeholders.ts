import { ICustomer } from '../../types/customer';
import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';

/**
 * Generate stakeholder-specific insights
 */
export function generateStakeholderInsights(customer: ICustomer): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!customer.stakeholders || customer.stakeholders.length === 0) {
    return insights;
  }

  const stakeholders = customer.stakeholders;
  const now = new Date();

  // Generate all stakeholder insights
  insights.push(...generateDisengagementInsights(stakeholders));
  insights.push(...generateInfluenceInsights(stakeholders));
  insights.push(...generateEngagementInsights(stakeholders));
  insights.push(...generateDecisionMakerInsights(stakeholders));
  insights.push(...generateTechnicalBusinessGapInsights(stakeholders));
  insights.push(...generateUpsellOpportunityInsights(stakeholders));
  insights.push(...generateCrossDepartmentalInsights(stakeholders));
  insights.push(...generateChurnRiskInsights(stakeholders));
  insights.push(...generateNewStakeholderInsights(stakeholders));
  insights.push(...generateGrowthTrendInsights(stakeholders));
  
  // Generate new high-impact insights
  insights.push(...generateContactFrequencyInsights(stakeholders));
  insights.push(...generateEngagementVelocityInsights(stakeholders));
  insights.push(...generateDepartmentalHealthInsights(stakeholders));
  insights.push(...generateRoleBasedInsights(stakeholders));

  console.log(`[CS Insights] 👥 stakeholder insights | count=${insights.length}`);
  return insights;
}

/**
 * Generate stakeholder disengagement insights
 */
function generateDisengagementInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const inactiveStakeholders = stakeholders.filter(s => s.engagement?.level === 'inactive');
  const lowEngagementStakeholders = stakeholders.filter(s => s.engagement?.level === 'low');
  
  if (inactiveStakeholders.length > 0) {
    const primaryInactive = inactiveStakeholders.filter(s => s.stakeholderType === 'primary');
    if (primaryInactive.length > 0) {
      insights.push({
        type: 'key_stakeholder_risk',
        message: `${primaryInactive.length} primary stakeholder(s) inactive - immediate attention required`,
        severity: 'red',
        category: 'risk',
        meta: { 
          inactivePrimaryStakeholders: primaryInactive.length,
          stakeholderNames: primaryInactive.map(s => s.name)
        }
      });
    } else {
      insights.push({
        type: 'stakeholder_disengagement',
        message: `${inactiveStakeholders.length} stakeholder(s) inactive - monitor engagement`,
        severity: inactiveStakeholders.length > 2 ? 'yellow' : 'info',
        category: 'risk',
        meta: { inactiveStakeholders: inactiveStakeholders.length }
      });
    }
  }

  return insights;
}

/**
 * Generate influence concentration insights
 */
function generateInfluenceInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const highInfluenceStakeholders = stakeholders.filter(s => 
    s.influence?.decisionPower >= 8 || s.influence?.adoptionInfluence >= 8
  );
  
  if (highInfluenceStakeholders.length <= 2 && stakeholders.length > 3) {
    insights.push({
      type: 'influence_concentration',
      message: `Decision power concentrated in ${highInfluenceStakeholders.length} stakeholder(s) - diversification needed`,
      severity: 'yellow',
      category: 'strategic',
      meta: { 
        highInfluenceCount: highInfluenceStakeholders.length,
        totalStakeholders: stakeholders.length
      }
    });
  }

  return insights;
}

/**
 * Generate engagement trends insights
 */
function generateEngagementInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const inactiveStakeholders = stakeholders.filter(s => s.engagement?.level === 'inactive');
  const lowEngagementStakeholders = stakeholders.filter(s => s.engagement?.level === 'low');
  
  const engagementLevels = stakeholders.reduce((acc: Record<string, number>, s) => {
    const level = s.engagement?.level || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const lowEngagementRatio = (lowEngagementStakeholders.length + inactiveStakeholders.length) / stakeholders.length;
  
  if (lowEngagementRatio > 0.5) {
    insights.push({
      type: 'engagement_trends',
      message: `${(lowEngagementRatio * 100).toFixed(0)}% of stakeholders have low/inactive engagement`,
      severity: lowEngagementRatio > 0.7 ? 'red' : 'yellow',
      category: 'risk',
      meta: { 
        lowEngagementRatio,
        engagementBreakdown: engagementLevels
      }
    });
  }

  return insights;
}

/**
 * Generate decision maker activity insights
 */
function generateDecisionMakerInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const primaryStakeholders = stakeholders.filter(s => s.stakeholderType === 'primary');
  const inactivePrimary = primaryStakeholders.filter(s => s.engagement?.level === 'inactive');
  
  if (inactivePrimary.length > 0) {
    insights.push({
      type: 'decision_maker_activity',
      message: `${inactivePrimary.length}/${primaryStakeholders.length} primary decision makers inactive`,
      severity: inactivePrimary.length === primaryStakeholders.length ? 'red' : 'yellow',
      category: 'risk',
      meta: { 
        inactivePrimaryCount: inactivePrimary.length,
        totalPrimaryCount: primaryStakeholders.length
      }
    });
  }

  return insights;
}

/**
 * Generate technical vs business engagement gap insights
 */
function generateTechnicalBusinessGapInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const technicalStakeholders = stakeholders.filter(s => s.stakeholderType === 'technical');
  const businessStakeholders = stakeholders.filter(s => s.stakeholderType === 'business');
  
  if (technicalStakeholders.length > 0 && businessStakeholders.length > 0) {
    const techEngagement = technicalStakeholders.reduce((sum, s) => {
      const level = s.engagement?.level;
      return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : level === 'low' ? 1 : 0);
    }, 0) / technicalStakeholders.length;
    
    const businessEngagement = businessStakeholders.reduce((sum, s) => {
      const level = s.engagement?.level;
      return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : level === 'low' ? 1 : 0);
    }, 0) / businessStakeholders.length;
    
    const engagementGap = Math.abs(techEngagement - businessEngagement);
    
    if (engagementGap > 1) {
      insights.push({
        type: 'technical_adoption_barriers',
        message: `Significant engagement gap between technical (${techEngagement.toFixed(1)}) and business (${businessEngagement.toFixed(1)}) stakeholders`,
        severity: engagementGap > 1.5 ? 'yellow' : 'info',
        category: 'customer_success',
        meta: { 
          technicalEngagement: techEngagement,
          businessEngagement: businessEngagement,
          engagementGap
        }
      });
    }
  }

  return insights;
}

/**
 * Generate upsell opportunity insights based on influence
 */
function generateUpsellOpportunityInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const highInfluenceLowEngagement = stakeholders.filter(s => 
    (s.influence?.decisionPower >= 7 || s.influence?.adoptionInfluence >= 7) && 
    s.engagement?.level === 'low'
  );
  
  if (highInfluenceLowEngagement.length > 0) {
    insights.push({
      type: 'stakeholder_influence_opportunity',
      message: `${highInfluenceLowEngagement.length} high-influence stakeholder(s) with low engagement - expansion opportunity`,
      severity: 'yellow',
      category: 'upsell',
      meta: { 
        stakeholders: highInfluenceLowEngagement.map(s => ({
          name: s.name,
          title: s.title,
          decisionPower: s.influence?.decisionPower,
          adoptionInfluence: s.influence?.adoptionInfluence
        }))
      }
    });
  }

  return insights;
}

/**
 * Generate cross-departmental engagement insights
 */
function generateCrossDepartmentalInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const departments = [...new Set(stakeholders.map(s => s.department))];
  const departmentEngagement = departments.map(dept => {
    const deptStakeholders = stakeholders.filter(s => s.department === dept);
    const avgEngagement = deptStakeholders.reduce((sum, s) => {
      const level = s.engagement?.level;
      return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : level === 'low' ? 1 : 0);
    }, 0) / deptStakeholders.length;
    
    return { department: dept, engagement: avgEngagement, count: deptStakeholders.length };
  });

  const highEngagementDepts = departmentEngagement.filter(d => d.engagement >= 2.5);
  const lowEngagementDepts = departmentEngagement.filter(d => d.engagement <= 1.5);
  
  if (highEngagementDepts.length > 0 && lowEngagementDepts.length > 0) {
    insights.push({
      type: 'cross_departmental_engagement',
      message: `High engagement in ${highEngagementDepts.map(d => d.department).join(', ')} but low in ${lowEngagementDepts.map(d => d.department).join(', ')}`,
      severity: 'info',
      category: 'strategic',
      meta: { 
        departmentEngagement,
        highEngagementDepts: highEngagementDepts.map(d => d.department),
        lowEngagementDepts: lowEngagementDepts.map(d => d.department)
      }
    });
  }

  return insights;
}

/**
 * Generate stakeholder churn risk insights
 */
function generateChurnRiskInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const now = new Date();
  const stakeholdersAtRisk = stakeholders.filter(s => {
    const lastContact = s.engagement?.lastContact;
    const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000)) : 999;
    
    return s.stakeholderType === 'primary' && 
           (s.engagement?.level === 'inactive' || daysSinceContact > 60);
  });
  
  if (stakeholdersAtRisk.length > 0) {
    insights.push({
      type: 'stakeholder_churn_risk',
      message: `${stakeholdersAtRisk.length} primary stakeholder(s) at high churn risk`,
      severity: 'red',
      category: 'risk',
      meta: { 
        atRiskStakeholders: stakeholdersAtRisk.map(s => ({
          name: s.name,
          title: s.title,
          lastContact: s.engagement?.lastContact,
          engagementLevel: s.engagement?.level
        }))
      }
    });
  }

  return insights;
}

/**
 * Generate new stakeholder insights
 */
function generateNewStakeholderInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const now = new Date();
  const recentStakeholders = stakeholders.filter(s => {
    const createdAt = s.createdAt;
    if (!createdAt) return false;
    
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
    return daysSinceCreated <= 30; // Stakeholders added in the last 30 days
  });

  if (recentStakeholders.length > 0) {
    const primaryNew = recentStakeholders.filter(s => s.stakeholderType === 'primary');
    const highInfluenceNew = recentStakeholders.filter(s => 
      s.influence?.decisionPower >= 7 || s.influence?.adoptionInfluence >= 7
    );
    
    if (primaryNew.length > 0) {
      insights.push({
        type: 'new_stakeholder_momentum',
        message: `${primaryNew.length} primary stakeholder(s) added in the last 30 days - expansion momentum building`,
        severity: 'info',
        category: 'customer_success',
        meta: { 
          newPrimaryStakeholders: primaryNew.length,
          totalNewStakeholders: recentStakeholders.length,
          stakeholders: primaryNew.map(s => ({
            name: s.name,
            title: s.title,
            department: s.department,
            daysSinceAdded: Math.floor((now.getTime() - s.createdAt!.getTime()) / (24 * 60 * 60 * 1000))
          }))
        }
      });
    } else if (recentStakeholders.length >= 2) {
      insights.push({
        type: 'new_stakeholder_momentum',
        message: `${recentStakeholders.length} new stakeholder(s) added in the last 30 days - growing engagement`,
        severity: 'info',
        category: 'customer_success',
        meta: { 
          totalNewStakeholders: recentStakeholders.length,
          stakeholders: recentStakeholders.map(s => ({
            name: s.name,
            title: s.title,
            department: s.department,
            stakeholderType: s.stakeholderType,
            daysSinceAdded: Math.floor((now.getTime() - s.createdAt!.getTime()) / (24 * 60 * 60 * 1000))
          }))
        }
      });
    }

    // Check for high-influence new stakeholders
    if (highInfluenceNew.length > 0) {
      insights.push({
        type: 'influencer_expansion_opportunity',
        message: `${highInfluenceNew.length} high-influence stakeholder(s) recently added - leverage for expansion`,
        severity: 'yellow',
        category: 'upsell',
        meta: { 
          highInfluenceNew: highInfluenceNew.length,
          stakeholders: highInfluenceNew.map(s => ({
            name: s.name,
            title: s.title,
            department: s.department,
            decisionPower: s.influence?.decisionPower,
            adoptionInfluence: s.influence?.adoptionInfluence,
            daysSinceAdded: Math.floor((now.getTime() - s.createdAt!.getTime()) / (24 * 60 * 60 * 1000))
          }))
        }
      });
    }
  }

  return insights;
}

/**
 * Generate stakeholder growth trend insights
 */
function generateGrowthTrendInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const stakeholdersByMonth = new Map<string, number>();
  stakeholders.forEach(s => {
    if (s.createdAt) {
      const month = s.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      stakeholdersByMonth.set(month, (stakeholdersByMonth.get(month) || 0) + 1);
    }
  });

  if (stakeholdersByMonth.size >= 2) {
    const sortedMonths = Array.from(stakeholdersByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const recentMonths = sortedMonths.slice(-2);
    
    if (recentMonths.length === 2) {
      const [prevMonth, currMonth] = recentMonths;
      const growthRate = prevMonth[1] > 0 ? ((currMonth[1] - prevMonth[1]) / prevMonth[1]) * 100 : 100;
      
      if (growthRate > 50) {
        insights.push({
          type: 'stakeholder_health_decline',
          message: `Stakeholder growth accelerating: ${growthRate.toFixed(0)}% increase in ${currMonth[0]}`,
          severity: 'info',
          category: 'strategic',
          meta: { 
            growthRate,
            previousMonth: prevMonth[0],
            currentMonth: currMonth[0],
            previousCount: prevMonth[1],
            currentCount: currMonth[1]
          }
        });
      }
    }
  }

  return insights;
}

/**
 * Generate contact frequency analysis insights
 */
function generateContactFrequencyInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const now = new Date();
  const stakeholdersWithContact = stakeholders.filter(s => s.engagement?.lastContact);
  
  if (stakeholdersWithContact.length === 0) return insights;

  // Analyze contact frequency patterns
  const contactGaps = stakeholdersWithContact.map(s => {
    const lastContact = s.engagement!.lastContact!;
    const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000));
    return {
      stakeholder: s,
      daysSinceContact,
      engagementLevel: s.engagement?.level
    };
  });

  // Identify stakeholders with contact frequency gaps
  const longGapStakeholders = contactGaps.filter(cg => 
    cg.daysSinceContact > 30 && cg.stakeholder.stakeholderType === 'primary'
  );
  
  const veryLongGapStakeholders = contactGaps.filter(cg => 
    cg.daysSinceContact > 60
  );

  // Check for over-contact (too frequent contact with low engagement)
  const overContactStakeholders = contactGaps.filter(cg => 
    cg.daysSinceContact < 7 && cg.engagementLevel === 'low'
  );

  if (longGapStakeholders.length > 0) {
    insights.push({
      type: 'contact_frequency_gap',
      message: `${longGapStakeholders.length} primary stakeholder(s) haven't been contacted in 30+ days`,
      severity: 'yellow',
      category: 'customer_success',
      meta: { 
        stakeholders: longGapStakeholders.map(cg => ({
          name: cg.stakeholder.name,
          title: cg.stakeholder.title,
          daysSinceContact: cg.daysSinceContact,
          lastContact: cg.stakeholder.engagement?.lastContact
        }))
      }
    });
  }

  if (veryLongGapStakeholders.length > 0) {
    insights.push({
      type: 'under_contact_risk',
      message: `${veryLongGapStakeholders.length} stakeholder(s) haven't been contacted in 60+ days - high churn risk`,
      severity: 'red',
      category: 'risk',
      meta: { 
        stakeholders: veryLongGapStakeholders.map(cg => ({
          name: cg.stakeholder.name,
          title: cg.stakeholder.title,
          stakeholderType: cg.stakeholder.stakeholderType,
          daysSinceContact: cg.daysSinceContact
        }))
      }
    });
  }

  if (overContactStakeholders.length > 0) {
    insights.push({
      type: 'over_contact_risk',
      message: `${overContactStakeholders.length} stakeholder(s) contacted too frequently with low engagement - adjust approach`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        stakeholders: overContactStakeholders.map(cg => ({
          name: cg.stakeholder.name,
          title: cg.stakeholder.title,
          daysSinceContact: cg.daysSinceContact,
          engagementLevel: cg.engagementLevel
        }))
      }
    });
  }

  return insights;
}

/**
 * Generate engagement velocity tracking insights
 */
function generateEngagementVelocityInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  const now = new Date();
  
  // Analyze engagement velocity based on recent activity and engagement levels
  const stakeholdersWithActivity = stakeholders.filter(s => 
    s.engagement?.lastContact || s.engagement?.lastLogin
  );

  if (stakeholdersWithActivity.length < 2) return insights;

  // Calculate engagement velocity (rate of change in engagement)
  const engagementVelocity = stakeholdersWithActivity.map(s => {
    const lastContact = s.engagement?.lastContact;
    const lastLogin = s.engagement?.lastLogin;
    const engagementLevel = s.engagement?.level;
    
    // Calculate days since last activity
    const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (24 * 60 * 60 * 1000)) : 999;
    const daysSinceLogin = lastLogin ? Math.floor((now.getTime() - lastLogin.getTime()) / (24 * 60 * 60 * 1000)) : 999;
    const daysSinceActivity = Math.min(daysSinceContact, daysSinceLogin);
    
    // Engagement score (higher = better)
    const engagementScore = engagementLevel === 'high' ? 3 : engagementLevel === 'medium' ? 2 : engagementLevel === 'low' ? 1 : 0;
    
    // Velocity score (recent activity with high engagement = positive velocity)
    const velocityScore = engagementScore - (daysSinceActivity / 30); // Normalize by 30 days
    
    return {
      stakeholder: s,
      engagementScore,
      daysSinceActivity,
      velocityScore
    };
  });

  // Identify stakeholders with declining engagement velocity
  const decliningVelocity = engagementVelocity.filter(ev => 
    ev.velocityScore < -0.5 && ev.stakeholder.stakeholderType === 'primary'
  );

  // Identify stakeholders with increasing engagement velocity
  const increasingVelocity = engagementVelocity.filter(ev => 
    ev.velocityScore > 1.5
  );

  // Identify momentum shifts (recent changes in engagement patterns)
  const momentumShifts = engagementVelocity.filter(ev => 
    ev.daysSinceActivity < 14 && Math.abs(ev.velocityScore) > 1
  );

  if (decliningVelocity.length > 0) {
    insights.push({
      type: 'engagement_velocity_decline',
      message: `${decliningVelocity.length} primary stakeholder(s) showing declining engagement velocity`,
      severity: 'yellow',
      category: 'risk',
      meta: { 
        stakeholders: decliningVelocity.map(ev => ({
          name: ev.stakeholder.name,
          title: ev.stakeholder.title,
          engagementScore: ev.engagementScore,
          daysSinceActivity: ev.daysSinceActivity,
          velocityScore: ev.velocityScore.toFixed(2)
        }))
      }
    });
  }

  if (increasingVelocity.length > 0) {
    insights.push({
      type: 'engagement_velocity_increase',
      message: `${increasingVelocity.length} stakeholder(s) showing increasing engagement velocity - capitalize on momentum`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        stakeholders: increasingVelocity.map(ev => ({
          name: ev.stakeholder.name,
          title: ev.stakeholder.title,
          engagementScore: ev.engagementScore,
          daysSinceActivity: ev.daysSinceActivity,
          velocityScore: ev.velocityScore.toFixed(2)
        }))
      }
    });
  }

  if (momentumShifts.length > 0) {
    insights.push({
      type: 'engagement_momentum_shift',
      message: `${momentumShifts.length} stakeholder(s) showing recent momentum shifts - monitor closely`,
      severity: 'info',
      category: 'customer_success',
      meta: { 
        stakeholders: momentumShifts.map(ev => ({
          name: ev.stakeholder.name,
          title: ev.stakeholder.title,
          engagementScore: ev.engagementScore,
          daysSinceActivity: ev.daysSinceActivity,
          velocityScore: ev.velocityScore.toFixed(2)
        }))
      }
    });
  }

  return insights;
}

/**
 * Generate departmental health analysis insights
 */
function generateDepartmentalHealthInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  // Group stakeholders by department
  const departmentGroups = stakeholders.reduce((acc: Record<string, typeof stakeholders>, s) => {
    const dept = s.department || 'Unknown';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(s);
    return acc;
  }, {});

  const departments = Object.keys(departmentGroups);
  if (departments.length < 2) return insights;

  // Analyze each department's health
  const departmentHealth = departments.map(dept => {
    const deptStakeholders = departmentGroups[dept];
    
    // Calculate engagement health
    const engagementLevels = deptStakeholders.map(s => s.engagement?.level || 'unknown');
    const highEngagement = engagementLevels.filter(level => level === 'high').length;
    const mediumEngagement = engagementLevels.filter(level => level === 'medium').length;
    const lowEngagement = engagementLevels.filter(level => level === 'low').length;
    const inactiveEngagement = engagementLevels.filter(level => level === 'inactive').length;
    
    const engagementHealth = (highEngagement * 3 + mediumEngagement * 2 + lowEngagement * 1) / deptStakeholders.length;
    
    // Calculate adoption health
    const avgUsageRate = deptStakeholders.reduce((sum, s) => sum + (s.engagement?.usageRate || 0), 0) / deptStakeholders.length;
    
    // Calculate influence distribution
    const avgDecisionPower = deptStakeholders.reduce((sum, s) => sum + (s.influence?.decisionPower || 0), 0) / deptStakeholders.length;
    
    return {
      department: dept,
      stakeholderCount: deptStakeholders.length,
      engagementHealth,
      avgUsageRate,
      avgDecisionPower,
      engagementBreakdown: { highEngagement, mediumEngagement, lowEngagement, inactiveEngagement }
    };
  });

  // Identify departments with poor engagement health
  const poorEngagementDepts = departmentHealth.filter(dh => dh.engagementHealth < 1.5);
  
  // Identify departments with adoption gaps
  const adoptionGapDepts = departmentHealth.filter(dh => dh.avgUsageRate < 30);
  
  // Identify cross-departmental silos (departments with very different engagement levels)
  const sortedByEngagement = departmentHealth.sort((a, b) => a.engagementHealth - b.engagementHealth);
  const engagementGap = sortedByEngagement.length > 1 ? 
    sortedByEngagement[sortedByEngagement.length - 1].engagementHealth - sortedByEngagement[0].engagementHealth : 0;

  if (poorEngagementDepts.length > 0) {
    insights.push({
      type: 'department_engagement_health',
      message: `${poorEngagementDepts.length} department(s) showing poor engagement health: ${poorEngagementDepts.map(d => d.department).join(', ')}`,
      severity: 'yellow',
      category: 'customer_success',
      meta: { 
        departments: poorEngagementDepts.map(dh => ({
          department: dh.department,
          stakeholderCount: dh.stakeholderCount,
          engagementHealth: dh.engagementHealth.toFixed(2),
          engagementBreakdown: dh.engagementBreakdown
        }))
      }
    });
  }

  if (adoptionGapDepts.length > 0) {
    insights.push({
      type: 'department_adoption_gaps',
      message: `${adoptionGapDepts.length} department(s) with low adoption rates: ${adoptionGapDepts.map(d => d.department).join(', ')}`,
      severity: 'yellow',
      category: 'customer_success',
      meta: { 
        departments: adoptionGapDepts.map(dh => ({
          department: dh.department,
          stakeholderCount: dh.stakeholderCount,
          avgUsageRate: dh.avgUsageRate.toFixed(1),
          avgDecisionPower: dh.avgDecisionPower.toFixed(1)
        }))
      }
    });
  }

  if (engagementGap > 2) {
    insights.push({
      type: 'cross_department_silos',
      message: `Significant engagement gap between departments (${engagementGap.toFixed(1)}) - silos detected`,
      severity: 'info',
      category: 'strategic',
      meta: { 
        engagementGap,
        departmentHealth: departmentHealth.map(dh => ({
          department: dh.department,
          engagementHealth: dh.engagementHealth.toFixed(2),
          stakeholderCount: dh.stakeholderCount
        }))
      }
    });
  }

  return insights;
}

/**
 * Generate role-based insights analysis
 */
function generateRoleBasedInsights(stakeholders: ICustomer['stakeholders']): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!stakeholders) return insights;

  // Group stakeholders by role (stakeholderType)
  const roleGroups = stakeholders.reduce((acc: Record<string, typeof stakeholders>, s) => {
    const role = s.stakeholderType || 'unknown';
    if (!acc[role]) acc[role] = [];
    acc[role].push(s);
    return acc;
  }, {});

  const roles = Object.keys(roleGroups);
  if (roles.length < 2) return insights;

  // Analyze each role's patterns
  const roleAnalysis = roles.map(role => {
    const roleStakeholders = roleGroups[role];
    
    // Calculate engagement patterns
    const engagementLevels = roleStakeholders.map(s => s.engagement?.level || 'unknown');
    const avgEngagement = engagementLevels.reduce((sum, level) => {
      return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : level === 'low' ? 1 : 0);
    }, 0) / roleStakeholders.length;
    
    // Calculate adoption patterns
    const avgUsageRate = roleStakeholders.reduce((sum, s) => sum + (s.engagement?.usageRate || 0), 0) / roleStakeholders.length;
    
    // Calculate influence distribution
    const avgDecisionPower = roleStakeholders.reduce((sum, s) => sum + (s.influence?.decisionPower || 0), 0) / roleStakeholders.length;
    const avgAdoptionInfluence = roleStakeholders.reduce((sum, s) => sum + (s.influence?.adoptionInfluence || 0), 0) / roleStakeholders.length;
    
    // Calculate team size patterns
    const avgTeamSize = roleStakeholders.reduce((sum, s) => sum + (s.influence?.teamSize || 0), 0) / roleStakeholders.length;
    
    return {
      role,
      stakeholderCount: roleStakeholders.length,
      avgEngagement,
      avgUsageRate,
      avgDecisionPower,
      avgAdoptionInfluence,
      avgTeamSize,
      engagementBreakdown: engagementLevels.reduce((acc: Record<string, number>, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {})
    };
  });

  // Identify role engagement patterns
  const lowEngagementRoles = roleAnalysis.filter(ra => ra.avgEngagement < 1.5);
  const highEngagementRoles = roleAnalysis.filter(ra => ra.avgEngagement > 2.5);
  
  // Identify role adoption barriers
  const adoptionBarrierRoles = roleAnalysis.filter(ra => ra.avgUsageRate < 25);
  
  // Identify influence distribution patterns
  const highInfluenceRoles = roleAnalysis.filter(ra => ra.avgDecisionPower > 7 || ra.avgAdoptionInfluence > 7);
  const lowInfluenceRoles = roleAnalysis.filter(ra => ra.avgDecisionPower < 3 && ra.avgAdoptionInfluence < 3);

  if (lowEngagementRoles.length > 0) {
    insights.push({
      type: 'role_engagement_patterns',
      message: `${lowEngagementRoles.length} role(s) showing low engagement patterns: ${lowEngagementRoles.map(r => r.role).join(', ')}`,
      severity: 'yellow',
      category: 'customer_success',
      meta: { 
        roles: lowEngagementRoles.map(ra => ({
          role: ra.role,
          stakeholderCount: ra.stakeholderCount,
          avgEngagement: ra.avgEngagement.toFixed(2),
          engagementBreakdown: ra.engagementBreakdown
        }))
      }
    });
  }

  if (adoptionBarrierRoles.length > 0) {
    insights.push({
      type: 'role_adoption_barriers',
      message: `${adoptionBarrierRoles.length} role(s) showing adoption barriers: ${adoptionBarrierRoles.map(r => r.role).join(', ')}`,
      severity: 'yellow',
      category: 'customer_success',
      meta: { 
        roles: adoptionBarrierRoles.map(ra => ({
          role: ra.role,
          stakeholderCount: ra.stakeholderCount,
          avgUsageRate: ra.avgUsageRate.toFixed(1),
          avgEngagement: ra.avgEngagement.toFixed(2)
        }))
      }
    });
  }

  if (highInfluenceRoles.length > 0 && lowInfluenceRoles.length > 0) {
    insights.push({
      type: 'role_influence_distribution',
      message: `Influence concentrated in ${highInfluenceRoles.map(r => r.role).join(', ')} while ${lowInfluenceRoles.map(r => r.role).join(', ')} have low influence`,
      severity: 'info',
      category: 'strategic',
      meta: { 
        highInfluenceRoles: highInfluenceRoles.map(ra => ({
          role: ra.role,
          avgDecisionPower: ra.avgDecisionPower.toFixed(1),
          avgAdoptionInfluence: ra.avgAdoptionInfluence.toFixed(1),
          stakeholderCount: ra.stakeholderCount
        })),
        lowInfluenceRoles: lowInfluenceRoles.map(ra => ({
          role: ra.role,
          avgDecisionPower: ra.avgDecisionPower.toFixed(1),
          avgAdoptionInfluence: ra.avgAdoptionInfluence.toFixed(1),
          stakeholderCount: ra.stakeholderCount
        }))
      }
    });
  }

  return insights;
}