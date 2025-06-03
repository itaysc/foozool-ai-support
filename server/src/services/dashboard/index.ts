import { ITicketAnalytics } from '@common/types';
import { 
  DashboardFilters,
  OverviewMetrics,
  ChurnAnalysis,
  EscalationAnalysis,
  JourneyAnalysis,
  WorkloadAnalysis,
  ResolutionAnalysis,
  SpecialistAnalysis,
  RevenueAnalysis,
  CompetitiveAnalysis,
  UpsellAnalysis,
  DocumentationAnalysis,
  TrainingAnalysis,
  ProcessAnalysis,
  VolumeForecasting,
  SatisfactionForecasting,
  ResourceForecasting,
  ActionPlan,
  DashboardOverviewResponse,
  CustomerBehaviorResponse,
  OperationalIntelligenceResponse,
  BusinessIntelligenceResponse,
  QualityInsightsResponse,
  PredictiveAnalyticsResponse,
  ActionableInsightsResponse
} from '@common/types';
import { ticketAnalyticsService } from '../ticket-analytics';
import { advancedInsightsService } from '../insights/advanced-insights';

export class DashboardService {
  
  async getOverviewMetrics(filters: DashboardFilters): Promise<DashboardOverviewResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30,
      limit: 1000
    });
    
    // Calculate key metrics
    const totalTickets = analyticsData.length;
    const avgSatisfaction = this.calculateAverage(analyticsData, 'satisfactionPrediction');
    const churnRiskCount = analyticsData.filter(t => t.churnRisk).length;
    const escalationRiskCount = analyticsData.filter(t => t.likelyToEscalate).length;
    const avgComplexity = this.calculateAverage(analyticsData, 'complexityScore');
    
    // Sentiment distribution
    const sentimentDistribution = {
      positive: analyticsData.filter(t => t.sentiment === 'positive').length,
      negative: analyticsData.filter(t => t.sentiment === 'negative').length,
      neutral: analyticsData.filter(t => t.sentiment === 'neutral').length
    };
    
    // Customer journey distribution
    const journeyDistribution = analyticsData.reduce((acc, ticket) => {
      const stage = ticket.customerJourneyStage;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get recent insights
    const advancedInsights = await advancedInsightsService.analyzeAdvancedInsights(
      analyticsData,
      { organization: filters.organization, productId: filters.productId }
    );
    
    return {
      overview: {
        totalTickets,
        avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
        churnRiskCount,
        escalationRiskCount,
        avgComplexity: Number(avgComplexity.toFixed(1)),
        sentimentDistribution,
        journeyDistribution
      },
      insights: {
        total: advancedInsights.insights.length,
        critical: advancedInsights.insights.filter(i => i.severity === 'critical').length,
        high: advancedInsights.insights.filter(i => i.severity === 'high').length,
        recent: advancedInsights.insights.slice(0, 5),
        confidence: advancedInsights.confidence,
        recommendations: advancedInsights.recommendations
      }
    };
  }
  
  async getCustomerBehaviorAnalytics(filters: DashboardFilters): Promise<CustomerBehaviorResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Churn risk analysis
    const churnAnalysis: ChurnAnalysis = {
      totalAtRisk: analyticsData.filter(t => t.churnRisk).length,
      bySegment: analyticsData.reduce((acc, ticket) => {
        if (ticket.churnRisk && ticket.customerSegment) {
          acc[ticket.customerSegment] = (acc[ticket.customerSegment] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      avgSatisfaction: this.calculateAverage(analyticsData.filter(t => t.churnRisk), 'satisfactionPrediction')
    };
    
    // Escalation risk patterns
    const escalationAnalysis: EscalationAnalysis = {
      totalAtRisk: analyticsData.filter(t => t.likelyToEscalate).length,
      avgRiskScore: this.calculateAverage(analyticsData, 'escalationRisk'),
      triggers: this.analyzeEscalationTriggers(analyticsData)
    };
    
    // Customer journey insights
    const journeyAnalysis: JourneyAnalysis = {
      stageDistribution: analyticsData.reduce((acc, ticket) => {
        const stage = ticket.customerJourneyStage;
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      satisfactionByStage: this.analyzeStagesSatisfaction(analyticsData)
    };
    
    return {
      churnAnalysis,
      escalationAnalysis,
      journeyAnalysis
    };
  }
  
  async getOperationalIntelligence(filters: DashboardFilters): Promise<OperationalIntelligenceResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Workload analysis
    const workloadAnalysis: WorkloadAnalysis = {
      highImpactTickets: analyticsData.filter(t => t.workloadImpact === 'high').length,
      avgComplexity: this.calculateAverage(analyticsData, 'complexityScore'),
      complexityDistribution: {
        low: analyticsData.filter(t => t.complexityScore <= 3).length,
        medium: analyticsData.filter(t => t.complexityScore > 3 && t.complexityScore <= 7).length,
        high: analyticsData.filter(t => t.complexityScore > 7).length
      }
    };
    
    // Resolution time insights
    const resolutionAnalysis: ResolutionAnalysis = {
      avgResolutionTime: this.calculateAverage(analyticsData.filter(t => t.resolutionTime), 'resolutionTime'),
      predictedTimes: analyticsData.map(t => ({
        ticketId: t.externalTicketId,
        predicted: t.resolutionPrediction,
        actual: t.resolutionTime
      })).filter(item => item.actual),
      bottlenecks: this.identifyBottlenecks(analyticsData)
    };
    
    // Specialist demand
    const specialistAnalysis: SpecialistAnalysis = {
      totalRequiring: analyticsData.filter(t => t.requiresSpecialist).length,
      topAreas: this.getTopRequiredAreas(analyticsData),
      skillGaps: this.assessSkillGaps(analyticsData)
    };
    
    return {
      workloadAnalysis,
      resolutionAnalysis,
      specialistAnalysis
    };
  }
  
  async getBusinessIntelligence(filters: DashboardFilters): Promise<BusinessIntelligenceResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Revenue impact analysis
    const revenueAnalysis: RevenueAnalysis = {
      highImpact: analyticsData.filter(t => t.revenueImpact === 'high' || t.revenueImpact === 'critical').length,
      impactDistribution: {
        low: analyticsData.filter(t => t.revenueImpact === 'low').length,
        medium: analyticsData.filter(t => t.revenueImpact === 'medium').length,
        high: analyticsData.filter(t => t.revenueImpact === 'high').length,
        critical: analyticsData.filter(t => t.revenueImpact === 'critical').length
      },
      affectedFeatures: this.getTopAffectedFeatures(analyticsData)
    };
    
    // Competitive intelligence
    const competitiveAnalysis: CompetitiveAnalysis = {
      competitorMentions: analyticsData.filter(t => t.competitorMentioned).length,
      pricingConcerns: analyticsData.filter(t => t.priceRelated).length,
      avgSatisfactionPricing: this.calculateAverage(analyticsData.filter(t => t.priceRelated), 'satisfactionPrediction')
    };
    
    // Upsell opportunities
    const upsellAnalysis: UpsellAnalysis = {
      totalOpportunities: analyticsData.filter(t => t.upsellOpportunity).length,
      estimatedRevenue: analyticsData.filter(t => t.upsellOpportunity).length * 500, // $500 avg
      bySegment: this.analyzeUpsellBySegment(analyticsData)
    };
    
    return {
      revenueAnalysis,
      competitiveAnalysis,
      upsellAnalysis
    };
  }
  
  async getQualityInsights(filters: DashboardFilters): Promise<QualityInsightsResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Documentation gaps
    const documentationAnalysis: DocumentationAnalysis = {
      gapCount: analyticsData.filter(t => t.documentationGap).length,
      knowledgeBaseGaps: analyticsData.filter(t => t.knowledgeBaseGap).length,
      topMissingTopics: this.getTopMissingDocumentation(analyticsData)
    };
    
    // Training opportunities
    const trainingAnalysis: TrainingAnalysis = {
      opportunityCount: analyticsData.filter(t => t.trainingOpportunity).length,
      skillAreas: this.getTrainingAreas(analyticsData),
      urgencyLevel: this.assessTrainingUrgency(analyticsData)
    };
    
    // Process improvements
    const processAnalysis: ProcessAnalysis = {
      improvementCount: analyticsData.filter(t => t.processImprovement).length,
      inefficiencies: this.identifyProcessInefficiencies(analyticsData),
      automationOpportunities: this.identifyAutomationOpportunities(analyticsData)
    };
    
    return {
      documentationAnalysis,
      trainingAnalysis,
      processAnalysis
    };
  }
  
  async getPredictiveAnalytics(filters: DashboardFilters): Promise<PredictiveAnalyticsResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Volume forecasting
    const volumeForecasting: VolumeForecasting = {
      dailyAverage: analyticsData.length / (filters.daysBack || 30),
      trend: this.calculateTrend(analyticsData),
      seasonalPatterns: this.analyzeSeasonalPatterns(analyticsData),
      nextWeekPrediction: this.predictNextWeekVolume(analyticsData)
    };
    
    // Satisfaction predictions
    const satisfactionForecasting: SatisfactionForecasting = {
      avgCurrent: this.calculateAverage(analyticsData, 'satisfactionPrediction'),
      trend: this.calculateSatisfactionTrend(analyticsData),
      riskFactors: this.identifySatisfactionRisks(analyticsData)
    };
    
    // Resource forecasting
    const resourceForecasting: ResourceForecasting = {
      specialistHoursNeeded: analyticsData.filter(t => t.requiresSpecialist).length * 2,
      expectedComplexity: this.calculateAverage(analyticsData, 'complexityScore'),
      capacityWarnings: this.identifyCapacityWarnings(analyticsData)
    };
    
    return {
      volumeForecasting,
      satisfactionForecasting,
      resourceForecasting
    };
  }
  
  async getActionableInsights(filters: DashboardFilters & { priority?: string }): Promise<ActionableInsightsResponse> {
    const analyticsData = await ticketAnalyticsService.getAnalyticsForInsights({
      organization: filters.organization,
      productId: filters.productId,
      daysBack: filters.daysBack || 30
    });
    
    // Get comprehensive insights
    const advancedInsights = await advancedInsightsService.analyzeAdvancedInsights(
      analyticsData,
      { organization: filters.organization, productId: filters.productId }
    );
    
    // Filter by priority if specified
    let filteredInsights = advancedInsights.insights;
    if (filters.priority && filters.priority !== 'all') {
      filteredInsights = advancedInsights.insights.filter(insight => 
        insight.severity === filters.priority
      );
    }
    
    // Sort by priority and confidence
    const prioritizedInsights = filteredInsights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
      const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
      
      if (aSeverity !== bSeverity) return bSeverity - aSeverity;
      return (b.confidence || 0) - (a.confidence || 0);
    });
    
    // Generate action plans
    const actionPlans = this.generateActionPlans(prioritizedInsights.slice(0, 10));
    
    return {
      insights: prioritizedInsights,
      recommendations: advancedInsights.recommendations,
      actionPlans,
      summary: {
        total: filteredInsights.length,
        critical: filteredInsights.filter(i => i.severity === 'critical').length,
        high: filteredInsights.filter(i => i.severity === 'high').length,
        avgConfidence: filteredInsights.length > 0 ? 
          filteredInsights.reduce((sum, i) => sum + (i.confidence || 0), 0) / filteredInsights.length : 0
      }
    };
  }
  
  // ========== HELPER METHODS ==========
  
  private calculateAverage(data: ITicketAnalytics[], field: keyof ITicketAnalytics): number {
    const values = data.map(item => Number(item[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  private analyzeEscalationTriggers(data: ITicketAnalytics[]): string[] {
    const triggers: string[] = [];
    const total = data.length;
    
    if (data.filter(t => t.sentiment === 'negative').length > total * 0.4) {
      triggers.push('negative_sentiment');
    }
    if (data.filter(t => t.complexityScore >= 8).length > total * 0.3) {
      triggers.push('high_complexity');
    }
    if (data.filter(t => t.businessCriticality >= 7).length > total * 0.2) {
      triggers.push('business_critical');
    }
    
    return triggers;
  }
  
  private analyzeStagesSatisfaction(data: ITicketAnalytics[]): Record<string, number> {
    const stages = ['onboarding', 'active', 'at_risk', 'churning', 'unknown'];
    const result: Record<string, number> = {};
    
    stages.forEach(stage => {
      const stageTickets = data.filter(t => t.customerJourneyStage === stage);
      result[stage] = stageTickets.length > 0 ? 
        this.calculateAverage(stageTickets, 'satisfactionPrediction') : 0;
    });
    
    return result;
  }
  
  private identifyBottlenecks(data: ITicketAnalytics[]): string[] {
    const bottlenecks: string[] = [];
    
    const avgResolution = this.calculateAverage(data.filter(t => t.resolutionTime), 'resolutionTime');
    const slowTickets = data.filter(t => t.resolutionTime && t.resolutionTime > avgResolution * 1.5);
    
    if (slowTickets.length > data.length * 0.2) {
      bottlenecks.push('resolution_delays');
    }
    
    if (data.filter(t => t.requiresSpecialist).length > data.length * 0.3) {
      bottlenecks.push('specialist_shortage');
    }
    
    return bottlenecks;
  }
  
  private getTopRequiredAreas(data: ITicketAnalytics[]): string[] {
    const specialistTickets = data.filter(t => t.requiresSpecialist);
    const topics = specialistTickets.flatMap(t => t.topics || []);
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([topic]) => topic);
  }
  
  private assessSkillGaps(data: ITicketAnalytics[]): string[] {
    const gaps: string[] = [];
    
    if (data.filter(t => t.technicalComplexity >= 8).length > data.length * 0.3) {
      gaps.push('technical_skills');
    }
    
    if (data.filter(t => t.integrationRelated).length > data.length * 0.2) {
      gaps.push('integration_expertise');
    }
    
    return gaps;
  }
  
  private getTopAffectedFeatures(data: ITicketAnalytics[]): string[] {
    const allFeatures = data.flatMap(t => t.featuresAffected || []);
    const featureCounts = allFeatures.reduce((acc, feature) => {
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(featureCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([feature]) => feature);
  }
  
  private analyzeUpsellBySegment(data: ITicketAnalytics[]): Record<string, number> {
    const upsellTickets = data.filter(t => t.upsellOpportunity);
    return upsellTickets.reduce((acc, ticket) => {
      const segment = ticket.customerSegment || 'unknown';
      acc[segment] = (acc[segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  private getTopMissingDocumentation(data: ITicketAnalytics[]): string[] {
    const docGapTickets = data.filter(t => t.documentationGap);
    const topics = docGapTickets.flatMap(t => t.topics || []);
    const topicCounts = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([topic]) => topic);
  }
  
  private getTrainingAreas(data: ITicketAnalytics[]): string[] {
    const trainingTickets = data.filter(t => t.trainingOpportunity);
    return trainingTickets.flatMap(t => t.topics || []).slice(0, 5);
  }
  
  private assessTrainingUrgency(data: ITicketAnalytics[]): string {
    const trainingNeeded = data.filter(t => t.trainingOpportunity).length;
    const percentage = trainingNeeded / data.length;
    
    if (percentage > 0.3) return 'high';
    if (percentage > 0.15) return 'medium';
    return 'low';
  }
  
  private identifyProcessInefficiencies(data: ITicketAnalytics[]): string[] {
    const inefficiencies: string[] = [];
    
    if (data.filter(t => t.reopenCount > 1).length > data.length * 0.1) {
      inefficiencies.push('high_reopen_rate');
    }
    
    if (data.filter(t => t.isEscalated).length > data.length * 0.15) {
      inefficiencies.push('excessive_escalations');
    }
    
    return inefficiencies;
  }
  
  private identifyAutomationOpportunities(data: ITicketAnalytics[]): string[] {
    const opportunities: string[] = [];
    
    if (data.filter(t => t.category === 'basic_questions').length > data.length * 0.3) {
      opportunities.push('chatbot_for_basic_questions');
    }
    
    if (data.filter(t => t.documentationGap).length > data.length * 0.2) {
      opportunities.push('automated_documentation_suggestions');
    }
    
    return opportunities;
  }
  
  private calculateTrend(data: ITicketAnalytics[]): string {
    // Simple trend calculation - would be more sophisticated in production
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    
    if (secondHalf.length > firstHalf.length * 1.1) return 'increasing';
    if (secondHalf.length < firstHalf.length * 0.9) return 'decreasing';
    return 'stable';
  }
  
  private analyzeSeasonalPatterns(data: ITicketAnalytics[]): string[] {
    const patterns: string[] = [];
    
    const monthlyDistribution = data.reduce((acc, ticket) => {
      const month = new Date(ticket.createdAt).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Simple seasonal pattern detection
    const avgPerMonth = data.length / 12;
    Object.entries(monthlyDistribution).forEach(([month, count]) => {
      if ((count as number) > avgPerMonth * 1.3) {
        patterns.push(`peak_month_${month}`);
      }
    });
    
    return patterns;
  }
  
  private predictNextWeekVolume(data: ITicketAnalytics[]): number {
    const dailyAverage = data.length / 30; // Assuming 30-day period
    return Math.round(dailyAverage * 7); // Next week prediction
  }
  
  private calculateSatisfactionTrend(data: ITicketAnalytics[]): string {
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    
    const firstAvg = this.calculateAverage(firstHalf, 'satisfactionPrediction');
    const secondAvg = this.calculateAverage(secondHalf, 'satisfactionPrediction');
    
    if (secondAvg > firstAvg * 1.05) return 'improving';
    if (secondAvg < firstAvg * 0.95) return 'declining';
    return 'stable';
  }
  
  private identifySatisfactionRisks(data: ITicketAnalytics[]): string[] {
    const risks: string[] = [];
    
    const lowSatisfaction = data.filter(t => t.satisfactionPrediction < 4).length;
    if (lowSatisfaction > data.length * 0.2) {
      risks.push('high_dissatisfaction_rate');
    }
    
    if (data.filter(t => t.churnRisk).length > data.length * 0.1) {
      risks.push('churn_risk_increase');
    }
    
    return risks;
  }
  
  private identifyCapacityWarnings(data: ITicketAnalytics[]): string[] {
    const warnings: string[] = [];
    
    if (data.filter(t => t.workloadImpact === 'high').length > data.length * 0.3) {
      warnings.push('high_workload_capacity');
    }
    
    if (data.filter(t => t.requiresSpecialist).length > data.length * 0.4) {
      warnings.push('specialist_capacity_shortage');
    }
    
    return warnings;
  }
  
  private generateActionPlans(insights: any[]): ActionPlan[] {
    return insights.map(insight => {
      const actions: Array<{ action: string; urgency: string; owner: string }> = [];
      
      switch (insight.type) {
        case 'churn_risk':
          actions.push(
            { action: 'Customer Success Outreach', urgency: 'immediate', owner: 'CS Team' },
            { action: 'Root Cause Analysis', urgency: 'high', owner: 'Product Team' }
          );
          break;
        case 'escalation_pattern':
          actions.push(
            { action: 'Agent Training', urgency: 'medium', owner: 'Support Manager' },
            { action: 'Process Review', urgency: 'high', owner: 'Operations' }
          );
          break;
        case 'revenue_impact_alert':
          actions.push(
            { action: 'Executive Review', urgency: 'immediate', owner: 'Leadership' },
            { action: 'Customer Retention Campaign', urgency: 'immediate', owner: 'Sales' }
          );
          break;
        default:
          actions.push(
            { action: 'Investigation Required', urgency: 'medium', owner: 'Support Team' }
          );
      }
      
      return {
        insightId: insight.type,
        title: insight.title,
        actions
      };
    });
  }
}

export const dashboardService = new DashboardService(); 