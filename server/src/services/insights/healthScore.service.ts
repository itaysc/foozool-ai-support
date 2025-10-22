import mongoose from 'mongoose';
import { getCustomerTicketStats } from '../../qdrant/service';
import { CustomerModel } from '../../schemas/customer.schema';
import { callLLM } from '../llm';
import { UserContextManager } from '../../context/userContext';
import { InsightModel } from '../../schemas/insights.schema';
import { assignInsightNumberAtomic } from './insightNumber.service';
import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';
import crypto from 'crypto';

export interface HealthScoreFactors {
  // Support Health (40% weight)
  supportHealth: {
    score: number;
    factors: {
      ticketVolume: number;
      avgSentiment: number;
      escalationRate: number;
      resolutionTime: number;
      csatRisk: number;
    };
  };
  
  // Engagement Health (30% weight)
  engagementHealth: {
    score: number;
    factors: {
      stakeholderEngagement: number;
      meetingFrequency: number;
      featureAdoption: number;
      responseTime: number;
    };
  };
  
  // Business Health (30% weight)
  businessHealth: {
    score: number;
    factors: {
      contractValue: number;
      usageGrowth: number;
      renewalRisk: number;
      expansionOpportunity: number;
    };
  };
  
  // Overall Health Score
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export class HealthScoreService {
  /**
   * Calculate comprehensive health score for a customer
   */
  async calculateHealthScore(customerId: string, organizationId: string): Promise<HealthScoreFactors> {
    console.log(`[Health Score] 🏥 Calculating health score for customer ${customerId}`);

    // Organization ID is already validated as string in user context

    // Get customer data
    const customer = await CustomerModel.findOne({ 
      _id: customerId, 
      organizationId: organizationId 
    });

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Get ticket statistics
    const ticketStats = await getCustomerTicketStats(customerId);
    
    // Get recent predictions from insights collection
    const { getPredictionInsights } = await import('./index');
    const recentPredictions = await getPredictionInsights(organizationId, customerId, 100);

    // Calculate Support Health (40% weight)
    const supportHealth = await this.calculateSupportHealth(ticketStats, recentPredictions);
    
    // Calculate Engagement Health (30% weight)
    const engagementHealth = await this.calculateEngagementHealth(customer);
    
    // Calculate Business Health (30% weight)
    const businessHealth = await this.calculateBusinessHealth(customer, ticketStats);

    // Calculate overall score
    const overallScore = Math.round(
      (supportHealth.score * 0.4) + 
      (engagementHealth.score * 0.3) + 
      (businessHealth.score * 0.3)
    );

    // Determine trend
    const trend = await this.calculateTrend(customerId, overallScore);

    return {
      supportHealth,
      engagementHealth,
      businessHealth,
      overallScore,
      trend,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate Support Health Score (0-100)
   */
  private async calculateSupportHealth(ticketStats: any, predictions: any[]): Promise<HealthScoreFactors['supportHealth']> {
    let score = 50; // Start with neutral score
    const factors: any = {};

    // Ticket Volume Factor (0-20 points)
    const ticketVolume = ticketStats.totalTickets;
    if (ticketVolume === 0) {
      factors.ticketVolume = 20; // No tickets = good
    } else if (ticketVolume <= 5) {
      factors.ticketVolume = 15; // Low volume = good
    } else if (ticketVolume <= 15) {
      factors.ticketVolume = 10; // Medium volume = neutral
    } else if (ticketVolume <= 30) {
      factors.ticketVolume = 5; // High volume = concerning
    } else {
      factors.ticketVolume = 0; // Very high volume = bad
    }

    // Sentiment Factor (0-20 points)
    const avgSentiment = ticketStats.avgSentiment;
    if (avgSentiment >= 0.3) {
      factors.avgSentiment = 20; // Very positive
    } else if (avgSentiment >= 0.1) {
      factors.avgSentiment = 15; // Positive
    } else if (avgSentiment >= -0.1) {
      factors.avgSentiment = 10; // Neutral
    } else if (avgSentiment >= -0.3) {
      factors.avgSentiment = 5; // Negative
    } else {
      factors.avgSentiment = 0; // Very negative
    }

    // Escalation Risk Factor (0-20 points)
    const highEscalationCount = predictions.filter(p => 
      p.escalationRisk === 'High'
    ).length;
    const escalationRate = predictions.length > 0 ? highEscalationCount / predictions.length : 0;
    
    if (escalationRate <= 0.1) {
      factors.escalationRate = 20; // Low escalation risk
    } else if (escalationRate <= 0.3) {
      factors.escalationRate = 10; // Medium escalation risk
    } else {
      factors.escalationRate = 0; // High escalation risk
    }

    // Resolution Time Factor (0-20 points)
    const longResolutionCount = predictions.filter(p => 
      p.longResolutionPredicted === true
    ).length;
    const longResolutionRate = predictions.length > 0 ? longResolutionCount / predictions.length : 0;
    
    if (longResolutionRate <= 0.2) {
      factors.resolutionTime = 20; // Fast resolution
    } else if (longResolutionRate <= 0.5) {
      factors.resolutionTime = 10; // Medium resolution time
    } else {
      factors.resolutionTime = 0; // Slow resolution
    }

    // CSAT Risk Factor (0-20 points)
    const highCsatRiskCount = predictions.filter(p => 
      p.csatRisk === 'High'
    ).length;
    const csatRiskRate = predictions.length > 0 ? highCsatRiskCount / predictions.length : 0;
    
    if (csatRiskRate <= 0.1) {
      factors.csatRisk = 20; // Low CSAT risk
    } else if (csatRiskRate <= 0.3) {
      factors.csatRisk = 10; // Medium CSAT risk
    } else {
      factors.csatRisk = 0; // High CSAT risk
    }

    // Calculate total support health score
    const supportScore = Math.round(
      factors.ticketVolume + 
      factors.avgSentiment + 
      factors.escalationRate + 
      factors.resolutionTime + 
      factors.csatRisk
    );

    return {
      score: supportScore,
      factors: {
        ticketVolume: factors.ticketVolume,
        avgSentiment: factors.avgSentiment,
        escalationRate: factors.escalationRate,
        resolutionTime: factors.resolutionTime,
        csatRisk: factors.csatRisk
      }
    };
  }

  /**
   * Calculate Engagement Health Score (0-100)
   */
  private async calculateEngagementHealth(customer: any): Promise<HealthScoreFactors['engagementHealth']> {
    let score = 50; // Start with neutral score
    const factors: any = {};

    // Stakeholder Engagement (0-25 points)
    const stakeholderCount = customer.stakeholders?.length || 0;
    const activeStakeholders = customer.stakeholders?.filter((s: any) => 
      s.engagementLevel === 'high' || s.engagementLevel === 'medium'
    ).length || 0;
    
    const engagementRate = stakeholderCount > 0 ? activeStakeholders / stakeholderCount : 0;
    factors.stakeholderEngagement = Math.round(engagementRate * 25);

    // Meeting Frequency (0-25 points)
    // This would need to be calculated based on actual meeting data
    // For now, using a placeholder based on customer segment
    const meetingFrequency = customer.segment === 'Enterprise' ? 25 : 
                           customer.segment === 'Mid-Market' ? 20 :
                           customer.segment === 'SMB' ? 15 : 10;
    factors.meetingFrequency = meetingFrequency;

    // Feature Adoption (0-25 points)
    // This would need to be calculated based on actual usage data
    // For now, using a placeholder
    factors.featureAdoption = 15; // Placeholder

    // Response Time (0-25 points)
    // This would need to be calculated based on actual response data
    factors.responseTime = 15; // Placeholder

    const engagementScore = Math.round(
      factors.stakeholderEngagement + 
      factors.meetingFrequency + 
      factors.featureAdoption + 
      factors.responseTime
    );

    return {
      score: engagementScore,
      factors: {
        stakeholderEngagement: factors.stakeholderEngagement,
        meetingFrequency: factors.meetingFrequency,
        featureAdoption: factors.featureAdoption,
        responseTime: factors.responseTime
      }
    };
  }

  /**
   * Calculate Business Health Score (0-100)
   */
  private async calculateBusinessHealth(customer: any, ticketStats: any): Promise<HealthScoreFactors['businessHealth']> {
    let score = 50; // Start with neutral score
    const factors: any = {};

    // Contract Value Factor (0-25 points)
    const contractValue = customer.financialMetrics?.contractValue || 0;
    if (contractValue >= 100000) {
      factors.contractValue = 25; // High value
    } else if (contractValue >= 50000) {
      factors.contractValue = 20; // Medium-high value
    } else if (contractValue >= 25000) {
      factors.contractValue = 15; // Medium value
    } else if (contractValue >= 10000) {
      factors.contractValue = 10; // Low-medium value
    } else {
      factors.contractValue = 5; // Low value
    }

    // Usage Growth Factor (0-25 points)
    // This would need to be calculated based on actual usage trends
    factors.usageGrowth = 15; // Placeholder

    // Renewal Risk Factor (0-25 points)
    // This would need to be calculated based on contract renewal data
    factors.renewalRisk = 15; // Placeholder

    // Expansion Opportunity Factor (0-25 points)
    // This would need to be calculated based on expansion signals
    factors.expansionOpportunity = 15; // Placeholder

    const businessScore = Math.round(
      factors.contractValue + 
      factors.usageGrowth + 
      factors.renewalRisk + 
      factors.expansionOpportunity
    );

    return {
      score: businessScore,
      factors: {
        contractValue: factors.contractValue,
        usageGrowth: factors.usageGrowth,
        renewalRisk: factors.renewalRisk,
        expansionOpportunity: factors.expansionOpportunity
      }
    };
  }

  /**
   * Calculate trend based on historical health scores
   */
  private async calculateTrend(customerId: string, currentScore: number): Promise<'improving' | 'stable' | 'declining'> {
    // This would need to store historical health scores
    // For now, return stable as placeholder
    return 'stable';
  }

  /**
   * Get health score insights and recommendations
   */
  async getHealthScoreInsights(healthScore: HealthScoreFactors): Promise<string[]> {
    const insights: string[] = [];

    // Support Health Insights
    if (healthScore.supportHealth.score < 40) {
      insights.push(`🚨 Critical: Support health is very low (${healthScore.supportHealth.score}/100). Immediate intervention required.`);
    } else if (healthScore.supportHealth.score < 60) {
      insights.push(`⚠️ Warning: Support health is below average (${healthScore.supportHealth.score}/100). Consider proactive support measures.`);
    }

    // Engagement Health Insights
    if (healthScore.engagementHealth.score < 40) {
      insights.push(`📞 Low Engagement: Customer engagement is concerning (${healthScore.engagementHealth.score}/100). Schedule check-in calls.`);
    }

    // Business Health Insights
    if (healthScore.businessHealth.score > 80) {
      insights.push(`💎 High Value: Excellent business health (${healthScore.businessHealth.score}/100). Consider expansion opportunities.`);
    }

    // Overall Insights
    if (healthScore.overallScore >= 80) {
      insights.push(`✅ Excellent: Customer is in great health (${healthScore.overallScore}/100). Maintain current engagement level.`);
    } else if (healthScore.overallScore >= 60) {
      insights.push(`👍 Good: Customer health is satisfactory (${healthScore.overallScore}/100). Monitor for any changes.`);
    } else if (healthScore.overallScore >= 40) {
      insights.push(`⚠️ At Risk: Customer health needs attention (${healthScore.overallScore}/100). Implement retention strategies.`);
    } else {
      insights.push(`🚨 Critical: Customer is at high risk (${healthScore.overallScore}/100). Immediate action required.`);
    }

    return insights;
  }

  /**
   * Generate health score risk insights and save to database with weekly deduplication
   */
  async generateHealthScoreRiskInsights(
    customerId: string, 
    organizationId: string, 
    healthScore: HealthScoreFactors
  ): Promise<CustomerSuccessInsight[]> {
    console.log(`[Health Score Insights] 🚨 Generating health score risk insights for customer ${customerId}`);
    
    const insights: CustomerSuccessInsight[] = [];
    const currentDate = new Date();
    
    // Determine if customer is at risk based on overall health score
    if (healthScore.overallScore < 60) {
      const severity = healthScore.overallScore < 40 ? 'red' : 'yellow';
      const riskLevel = healthScore.overallScore < 40 ? 'Critical' : 'At Risk';
      
      // Resolve SLA using customer's SLA definitions via LLM
      let resolvedSLA: any | undefined = undefined;
      try {
        const cust = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
        const slas = (cust as any)?.slas || [];
        if (Array.isArray(slas) && slas.length > 0) {
          const prompt = `Select the most appropriate SLA for this health risk insight given the customer-defined SLAs.\nInsight: ${JSON.stringify({ type: 'health_score_at_risk', severity, meta: { overall: healthScore.overallScore, support: healthScore.supportHealth.score, engagement: healthScore.engagementHealth.score, business: healthScore.businessHealth.score, trend: healthScore.trend } }).slice(0,4000)}\nSLAs: ${JSON.stringify(slas).slice(0,4000)}\nReturn compact JSON {\"name\": string, \"amount\": number, \"unit\": \"minutes\"|\"hours\"|\"days\"}.`;
          const currentUserId = UserContextManager.getCurrentUserId();
          if (!currentUserId) { resolvedSLA = undefined; }
          else {
            const res: any = await callLLM({ userId: currentUserId, isChat: false, systemMsg: 'Select SLA', prompt, maxTokens: 200, temperature: 0 });
            if (res?.data) {
              try { resolvedSLA = JSON.parse(res.data); } catch {}
            }
          }
        }
      } catch (e) {
        console.warn('[Health Score Insights] SLA resolution failed:', e);
      }

      const insight: CustomerSuccessInsight = {
        type: 'health_score_at_risk',
        message: `Customer health score is ${riskLevel.toLowerCase()} (${healthScore.overallScore}/100). ${this.getHealthScoreRiskMessage(healthScore)}`,
        severity: severity,
        category: 'risk',
        meta: {
          healthScore: healthScore.overallScore,
          supportHealth: healthScore.supportHealth.score,
          engagementHealth: healthScore.engagementHealth.score,
          businessHealth: healthScore.businessHealth.score,
          trend: healthScore.trend,
          riskFactors: this.getRiskFactors(healthScore),
          lastUpdated: healthScore.lastUpdated,
          guidance: {
            summary: `Overall health ${riskLevel.toLowerCase()} at ${healthScore.overallScore}/100. Focus on top drivers below.`,
            why: 'Composite leading indicators predict churn risk; addressing contributors improves renewal odds.',
            signals: [
              `Support health: ${healthScore.supportHealth.score}/100`,
              `Engagement health: ${healthScore.engagementHealth.score}/100`,
              `Business health: ${healthScore.businessHealth.score}/100`,
              `Trend: ${healthScore.trend}`
            ],
            actions: [
              'Schedule a recovery-plan call with sponsor/champion this week.',
              'Agree on 3 measurable actions with owners and due dates; target +10 within 30 days.',
              'Increase weekly check-ins until two consecutive weeks of improvement.'
            ],
            considerations: 'Share a short value recap deck before the call to re-anchor ROI.',
            owner: 'CSM',
            slaDays: severity === 'red' ? 3 : 5
          },
          sla: resolvedSLA
        },
        status: 'new',
        createdAt: currentDate.toISOString(),
        customerId: customerId,
        customerName: '' // Will be populated when saving to database
      };
      
      insights.push(insight);
    }
    
    // Save insights to database with weekly deduplication
    if (insights.length > 0) {
      await this.persistHealthScoreRiskInsights(organizationId, customerId, insights);
    }
    
    return insights;
  }

  /**
   * Get detailed risk message based on health score factors
   */
  private getHealthScoreRiskMessage(healthScore: HealthScoreFactors): string {
    const messages: string[] = [];
    
    if (healthScore.supportHealth.score < 40) {
      messages.push('Support health is critically low');
    } else if (healthScore.supportHealth.score < 60) {
      messages.push('Support health needs attention');
    }
    
    if (healthScore.engagementHealth.score < 40) {
      messages.push('Customer engagement is concerning');
    }
    
    if (healthScore.businessHealth.score < 40) {
      messages.push('Business health indicators are poor');
    }
    
    if (healthScore.trend === 'declining') {
      messages.push('Health score is declining');
    }
    
    if (messages.length === 0) {
      return 'Multiple health indicators require attention';
    }
    
    return messages.join(', ') + '.';
  }

  /**
   * Get specific risk factors for the insight metadata
   */
  private getRiskFactors(healthScore: HealthScoreFactors): string[] {
    const riskFactors: string[] = [];
    
    // Support health risk factors
    if (healthScore.supportHealth.factors.ticketVolume < 10) {
      riskFactors.push('High ticket volume');
    }
    if (healthScore.supportHealth.factors.avgSentiment < 10) {
      riskFactors.push('Negative sentiment trend');
    }
    if (healthScore.supportHealth.factors.escalationRate < 10) {
      riskFactors.push('High escalation rate');
    }
    if (healthScore.supportHealth.factors.resolutionTime < 10) {
      riskFactors.push('Slow resolution times');
    }
    if (healthScore.supportHealth.factors.csatRisk < 10) {
      riskFactors.push('High CSAT risk');
    }
    
    // Engagement health risk factors
    if (healthScore.engagementHealth.factors.stakeholderEngagement < 15) {
      riskFactors.push('Low stakeholder engagement');
    }
    if (healthScore.engagementHealth.factors.meetingFrequency < 15) {
      riskFactors.push('Infrequent meetings');
    }
    if (healthScore.engagementHealth.factors.featureAdoption < 15) {
      riskFactors.push('Low feature adoption');
    }
    if (healthScore.engagementHealth.factors.responseTime < 15) {
      riskFactors.push('Slow response times');
    }
    
    // Business health risk factors
    if (healthScore.businessHealth.factors.contractValue < 15) {
      riskFactors.push('Low contract value');
    }
    if (healthScore.businessHealth.factors.usageGrowth < 15) {
      riskFactors.push('Declining usage growth');
    }
    if (healthScore.businessHealth.factors.renewalRisk < 15) {
      riskFactors.push('High renewal risk');
    }
    if (healthScore.businessHealth.factors.expansionOpportunity < 15) {
      riskFactors.push('Limited expansion opportunity');
    }
    
    return riskFactors;
  }

  /**
   * Generate deterministic cluster ID for weekly deduplication
   */
  private generateHealthScoreClusterId(customerId: string, weekYear: string): string {
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        type: 'health_score_at_risk',
        customerId: customerId,
        weekYear: weekYear
      }))
      .digest('hex')
      .substring(0, 12);
    
    return `hs:${contentHash}`;
  }

  /**
   * Get week and year string (e.g., "W33-2025")
   */
  private getWeekYear(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `W${weekNumber}-${year}`;
  }

  /**
   * Persist health score risk insights with weekly deduplication
   */
  private async persistHealthScoreRiskInsights(
    organizationId: string, 
    customerId: string, 
    insights: CustomerSuccessInsight[]
  ): Promise<void> {
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const custObjId = new mongoose.Types.ObjectId(customerId);
    const currentDate = new Date();
    const weekYear = this.getWeekYear(currentDate);

    // Get customer name
    let customerName = '';
    try {
      const customer = await CustomerModel.findOne({ _id: custObjId, organizationId: orgObjId });
      customerName = customer?.name || 'Unknown Customer';
    } catch (error) {
      console.error('[Health Score Insights] Error fetching customer name:', error);
      customerName = 'Unknown Customer';
    }

    for (const insight of insights) {
      const clusterId = this.generateHealthScoreClusterId(customerId, weekYear);
      
      // Check if insight already exists for this week
      const existingInsight = await InsightModel.findOne({
        organizationId: orgObjId,
        customerId: custObjId,
        insightType: 'customer_success',
        clusterId: clusterId
      });

      if (existingInsight) {
        console.log(`[Health Score Insights] ⚠️ Insight already exists for customer ${customerId} in week ${weekYear}, updating instead of creating duplicate`);
        
        // Update existing insight with new health score data
        await InsightModel.findOneAndUpdate(
          { _id: existingInsight._id },
          {
            issueDescription: insight.message,
            metadata: {
              type: insight.type,
              severity: insight.severity,
              category: insight.category,
              meta: insight.meta
            },
            status: insight.status || 'new',
            lastUpdatedAt: currentDate
          }
        );
      } else {
        // Create new insight
        const created = await InsightModel.findOneAndUpdate(
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
            ticketVolume: 0, // Not applicable for health score insights
            growthRate: 0, // Not applicable for health score insights
            metadata: {
              type: insight.type,
              severity: insight.severity,
              category: insight.category,
              meta: insight.meta
            },
            assignee: insight.assignee ? new mongoose.Types.ObjectId(insight.assignee) : undefined,
            status: insight.status || 'new',
            firstDetectedAt: insight.createdAt ? new Date(insight.createdAt) : currentDate,
            lastUpdatedAt: currentDate
          },
          { upsert: true, new: true }
        );
        if (!created.insightNumber) {
          await assignInsightNumberAtomic(created._id as any);
        }
        
        console.log(`[Health Score Insights] ✅ Created new health score risk insight for customer ${customerId} in week ${weekYear}`);
      }
    }
  }
}

export default HealthScoreService;
