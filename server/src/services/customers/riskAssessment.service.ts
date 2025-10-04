import { HealthScoreFactors } from '../insights/healthScore.service';
import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';
import QdrantService from '../../qdrant/service';
import { PredictionModel } from '../../schemas/prediction.schema';
import { UserContextManager } from '../../context/userContext';

export interface RiskAssessment {
  churnRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    evidence: string[];
    recommendations: string[];
    urgency: 'immediate' | 'short-term' | 'long-term';
  };
  satisfactionRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    evidence: string[];
    recommendations: string[];
    urgency: 'immediate' | 'short-term' | 'long-term';
  };
  engagementRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    evidence: string[];
    recommendations: string[];
    urgency: 'immediate' | 'short-term' | 'long-term';
  };
  overallRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    primaryConcerns: string[];
    immediateActions: string[];
  };
}

export class RiskAssessmentService {
  private qdrantService: QdrantService;

  constructor() {
    this.qdrantService = new QdrantService();
  }

  /**
   * Perform comprehensive risk assessment for a customer
   */
  async assessCustomerRisks(
    customerId: string, 
    healthScore: HealthScoreFactors,
    insights: CustomerSuccessInsight[],
    customerNews?: any
  ): Promise<RiskAssessment> {
    console.log(`[Risk Assessment] 🔍 Assessing risks for customer ${customerId}`);

    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('Organization ID not found in user context');
    }

    // Get ticket statistics for deeper analysis
    const ticketStats = await this.qdrantService.getCustomerTicketStats(customerId);
    
    // Get recent predictions
    const recentPredictions = await PredictionModel.find({
      organizationId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ createdAt: -1 }).limit(50);

    // Assess each type of risk
    const churnRisk = await this.assessChurnRisk(healthScore, ticketStats, recentPredictions, insights, customerNews);
    const satisfactionRisk = await this.assessSatisfactionRisk(healthScore, ticketStats, recentPredictions, insights);
    const engagementRisk = await this.assessEngagementRisk(healthScore, insights, customerNews);

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(churnRisk, satisfactionRisk, engagementRisk);

    return {
      churnRisk,
      satisfactionRisk,
      engagementRisk,
      overallRisk
    };
  }

  /**
   * Assess churn risk based on multiple factors
   */
  private async assessChurnRisk(
    healthScore: HealthScoreFactors,
    ticketStats: any,
    predictions: any[],
    insights: CustomerSuccessInsight[],
    customerNews?: any
  ): Promise<RiskAssessment['churnRisk']> {
    let riskScore = 0;
    const evidence: string[] = [];
    const recommendations: string[] = [];

    // Health score factors (40% weight)
    if (healthScore.overallScore < 30) {
      riskScore += 40;
      evidence.push(`Critical health score: ${healthScore.overallScore}/100`);
      recommendations.push('Schedule immediate executive escalation call');
    } else if (healthScore.overallScore < 50) {
      riskScore += 30;
      evidence.push(`Low health score: ${healthScore.overallScore}/100`);
      recommendations.push('Implement retention action plan');
    } else if (healthScore.overallScore < 70) {
      riskScore += 15;
      evidence.push(`Below-average health score: ${healthScore.overallScore}/100`);
    }

    // Support health factors (25% weight)
    if (healthScore.supportHealth.score < 30) {
      riskScore += 25;
      evidence.push(`Critical support health: ${healthScore.supportHealth.score}/100`);
      recommendations.push('Assign dedicated support manager');
    } else if (healthScore.supportHealth.score < 50) {
      riskScore += 15;
      evidence.push(`Poor support health: ${healthScore.supportHealth.score}/100`);
      recommendations.push('Implement proactive support measures');
    }

    // Ticket sentiment trends (20% weight)
    if (ticketStats.avgSentiment < -0.3) {
      riskScore += 20;
      evidence.push(`Very negative ticket sentiment: ${ticketStats.avgSentiment.toFixed(2)}`);
      recommendations.push('Address root causes of dissatisfaction');
    } else if (ticketStats.avgSentiment < -0.1) {
      riskScore += 10;
      evidence.push(`Negative ticket sentiment: ${ticketStats.avgSentiment.toFixed(2)}`);
    }

    // High ticket volume (10% weight)
    if (ticketStats.totalTickets > 20) {
      riskScore += 10;
      evidence.push(`High ticket volume: ${ticketStats.totalTickets} tickets`);
      recommendations.push('Investigate recurring issues');
    }

    // News sentiment (5% weight)
    if (customerNews?.news) {
      const negativeNews = customerNews.news.filter((item: any) => 
        item.impact === 'negative' && item.relevance === 'high'
      );
      if (negativeNews.length > 0) {
        riskScore += 5;
        evidence.push(`${negativeNews.length} negative news items about company`);
        recommendations.push('Address concerns related to recent company news');
      }
    }

    // Determine risk level and urgency
    const level = this.getRiskLevel(riskScore);
    const urgency = this.getUrgency(riskScore, evidence);

    return {
      level,
      score: Math.min(riskScore, 100),
      evidence,
      recommendations,
      urgency
    };
  }

  /**
   * Assess satisfaction risk
   */
  private async assessSatisfactionRisk(
    healthScore: HealthScoreFactors,
    ticketStats: any,
    predictions: any[],
    insights: CustomerSuccessInsight[]
  ): Promise<RiskAssessment['satisfactionRisk']> {
    let riskScore = 0;
    const evidence: string[] = [];
    const recommendations: string[] = [];

    // CSAT predictions (40% weight)
    const highCsatRiskCount = predictions.filter(p => 
      p.predictedCSAT?.risk === 'High'
    ).length;
    const csatRiskRate = predictions.length > 0 ? highCsatRiskCount / predictions.length : 0;
    
    if (csatRiskRate > 0.5) {
      riskScore += 40;
      evidence.push(`High CSAT risk predicted: ${(csatRiskRate * 100).toFixed(1)}% of recent tickets`);
      recommendations.push('Implement customer satisfaction improvement plan');
    } else if (csatRiskRate > 0.3) {
      riskScore += 25;
      evidence.push(`Medium CSAT risk predicted: ${(csatRiskRate * 100).toFixed(1)}% of recent tickets`);
    }

    // Support health factors (30% weight)
    if (healthScore.supportHealth.score < 40) {
      riskScore += 30;
      evidence.push(`Poor support health: ${healthScore.supportHealth.score}/100`);
      recommendations.push('Improve support response times and quality');
    } else if (healthScore.supportHealth.score < 60) {
      riskScore += 15;
      evidence.push(`Below-average support health: ${healthScore.supportHealth.score}/100`);
    }

    // Ticket sentiment (20% weight)
    if (ticketStats.avgSentiment < -0.2) {
      riskScore += 20;
      evidence.push(`Negative sentiment trend: ${ticketStats.avgSentiment.toFixed(2)}`);
      recommendations.push('Address customer concerns proactively');
    } else if (ticketStats.avgSentiment < 0) {
      riskScore += 10;
      evidence.push(`Neutral to negative sentiment: ${ticketStats.avgSentiment.toFixed(2)}`);
    }

    // Escalation patterns (10% weight)
    const highEscalationCount = predictions.filter(p => 
      p.predictedEscalation?.risk === 'High'
    ).length;
    const escalationRate = predictions.length > 0 ? highEscalationCount / predictions.length : 0;
    
    if (escalationRate > 0.3) {
      riskScore += 10;
      evidence.push(`High escalation rate: ${(escalationRate * 100).toFixed(1)}%`);
      recommendations.push('Review escalation triggers and processes');
    }

    const level = this.getRiskLevel(riskScore);
    const urgency = this.getUrgency(riskScore, evidence);

    return {
      level,
      score: Math.min(riskScore, 100),
      evidence,
      recommendations,
      urgency
    };
  }

  /**
   * Assess engagement risk
   */
  private async assessEngagementRisk(
    healthScore: HealthScoreFactors,
    insights: CustomerSuccessInsight[],
    customerNews?: any
  ): Promise<RiskAssessment['engagementRisk']> {
    let riskScore = 0;
    const evidence: string[] = [];
    const recommendations: string[] = [];

    // Engagement health factors (50% weight)
    if (healthScore.engagementHealth.score < 30) {
      riskScore += 50;
      evidence.push(`Critical engagement health: ${healthScore.engagementHealth.score}/100`);
      recommendations.push('Schedule immediate stakeholder check-in calls');
    } else if (healthScore.engagementHealth.score < 50) {
      riskScore += 30;
      evidence.push(`Low engagement health: ${healthScore.engagementHealth.score}/100`);
      recommendations.push('Increase meeting frequency and stakeholder outreach');
    } else if (healthScore.engagementHealth.score < 70) {
      riskScore += 15;
      evidence.push(`Below-average engagement: ${healthScore.engagementHealth.score}/100`);
    }

    // Low stakeholder engagement (30% weight)
    const lowEngagementInsights = insights.filter(insight => 
      insight.type.includes('stakeholder') && insight.severity === 'red'
    );
    if (lowEngagementInsights.length > 0) {
      riskScore += 30;
      evidence.push(`${lowEngagementInsights.length} stakeholder engagement issues`);
      recommendations.push('Re-engage key stakeholders with personalized outreach');
    }

    // News engagement opportunities (20% weight)
    if (customerNews?.news) {
      const positiveNews = customerNews.news.filter((item: any) => 
        item.impact === 'positive' && item.relevance === 'high'
      );
      if (positiveNews.length > 0) {
        riskScore -= 10; // Reduce risk for positive news
        evidence.push(`${positiveNews.length} positive news items - engagement opportunity`);
        recommendations.push('Leverage positive news for relationship building');
      }
    }

    const level = this.getRiskLevel(Math.max(riskScore, 0));
    const urgency = this.getUrgency(riskScore, evidence);

    return {
      level,
      score: Math.min(Math.max(riskScore, 0), 100),
      evidence,
      recommendations,
      urgency
    };
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(
    churnRisk: RiskAssessment['churnRisk'],
    satisfactionRisk: RiskAssessment['satisfactionRisk'],
    engagementRisk: RiskAssessment['engagementRisk']
  ): RiskAssessment['overallRisk'] {
    // Weighted average of all risks
    const overallScore = Math.round(
      (churnRisk.score * 0.5) + 
      (satisfactionRisk.score * 0.3) + 
      (engagementRisk.score * 0.2)
    );

    const level = this.getRiskLevel(overallScore);
    
    // Collect primary concerns
    const primaryConcerns: string[] = [];
    if (churnRisk.level === 'high' || churnRisk.level === 'critical') {
      primaryConcerns.push('High churn risk');
    }
    if (satisfactionRisk.level === 'high' || satisfactionRisk.level === 'critical') {
      primaryConcerns.push('Customer satisfaction issues');
    }
    if (engagementRisk.level === 'high' || engagementRisk.level === 'critical') {
      primaryConcerns.push('Low customer engagement');
    }

    // Collect immediate actions
    const immediateActions: string[] = [];
    if (churnRisk.urgency === 'immediate') {
      immediateActions.push(...churnRisk.recommendations.slice(0, 2));
    }
    if (satisfactionRisk.urgency === 'immediate') {
      immediateActions.push(...satisfactionRisk.recommendations.slice(0, 2));
    }
    if (engagementRisk.urgency === 'immediate') {
      immediateActions.push(...engagementRisk.recommendations.slice(0, 2));
    }

    return {
      level,
      score: overallScore,
      primaryConcerns,
      immediateActions
    };
  }

  /**
   * Convert risk score to risk level
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Determine urgency based on risk score and evidence
   */
  private getUrgency(score: number, evidence: string[]): 'immediate' | 'short-term' | 'long-term' {
    if (score >= 70 || evidence.some(e => e.includes('Critical'))) {
      return 'immediate';
    }
    if (score >= 40 || evidence.some(e => e.includes('High') || e.includes('Poor'))) {
      return 'short-term';
    }
    return 'long-term';
  }
}

export default RiskAssessmentService;
