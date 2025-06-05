import { ITicketAnalytics } from '@common/types';
import { 
  InsightType, 
  InsightSeverity, 
  InsightCategory,
  InsightStatus,
  InsightTrend,
  IInsightAnalysisResult,
  IInsight
} from '@common/types';
import { TicketAnalyticsModel } from '../../schemas/ticket-analytics.schema';

export class AdvancedInsightsService {
  
  /**
   * Analyze advanced insights from ticket analytics data
   */
  async analyzeAdvancedInsights(
    ticketsAnalytics: ITicketAnalytics[],
    filters?: {
      organization?: string;
      productId?: string;
      daysBack?: number;
    }
  ): Promise<IInsightAnalysisResult> {
    
    const insights: Partial<IInsight>[] = [];
    
    // Customer Behavior Insights
    insights.push(...await this.analyzeChurnRiskPatterns(ticketsAnalytics, filters));
    insights.push(...await this.analyzeEscalationPatterns(ticketsAnalytics, filters));
    insights.push(...await this.analyzeCustomerJourneyIssues(ticketsAnalytics, filters));
    
    // Operational Intelligence
    insights.push(...await this.analyzeWorkloadImbalances(ticketsAnalytics, filters));
    insights.push(...await this.analyzeResolutionTimeAnomalies(ticketsAnalytics, filters));
    insights.push(...await this.analyzeComplexitySurges(ticketsAnalytics, filters));
    insights.push(...await this.analyzeSpecialistDemand(ticketsAnalytics, filters));
    
    // Business Intelligence
    insights.push(...await this.analyzeRevenueImpactAlerts(ticketsAnalytics, filters));
    insights.push(...await this.analyzeCompetitorThreats(ticketsAnalytics, filters));
    insights.push(...await this.analyzePricingConcerns(ticketsAnalytics, filters));
    insights.push(...await this.analyzeUpsellOpportunities(ticketsAnalytics, filters));
    
    // Quality Assurance
    insights.push(...await this.analyzeDocumentationGaps(ticketsAnalytics, filters));
    insights.push(...await this.analyzeTrainingOpportunities(ticketsAnalytics, filters));
    insights.push(...await this.analyzeProcessImprovements(ticketsAnalytics, filters));
    
    // Communication & Experience
    insights.push(...await this.analyzeCommunicationMismatches(ticketsAnalytics, filters));
    insights.push(...await this.analyzeEmotionalIntensitySpikes(ticketsAnalytics, filters));
    
    // Predictive Insights
    insights.push(...await this.analyzeSatisfactionDeclinePredictions(ticketsAnalytics, filters));
    insights.push(...await this.analyzeSeasonalSurgePredictions(ticketsAnalytics, filters));
    
    // Strategic Insights
    insights.push(...await this.analyzeMarketFeedback(ticketsAnalytics, filters));
    insights.push(...await this.analyzeProductRoadmapSignals(ticketsAnalytics, filters));
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(insights, ticketsAnalytics.length);
    
    // Generate advanced recommendations
    const recommendations = this.generateAdvancedRecommendations(insights);
    
    return {
      insights: insights.filter(insight => (insight.confidence || 0) > 0.3), // Filter low-confidence insights
      confidence,
      recommendations
    };
  }
  
  /**
   * Helper method to create complete insight objects
   */
  private createInsight(data: {
    type: InsightType;
    title: string;
    description: string;
    severity: InsightSeverity;
    category: InsightCategory;
    confidence: number;
    frequency: number;
    keywords: string[];
    ticketIds: string[];
    patterns: string[];
    organization?: string;
    productId?: string;
    metadata?: any;
  }): Partial<IInsight> {
    const now = new Date();
    return {
      type: data.type,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: InsightStatus.ACTIVE,
      confidence: data.confidence,
      frequency: data.frequency,
      trend: InsightTrend.STABLE, // Would be calculated from historical data
      organization: data.organization,
      productId: data.productId,
      category: data.category,
      tags: data.keywords.slice(0, 5), // First 5 keywords as tags
      ticketIds: data.ticketIds,
      keywords: data.keywords,
      patterns: data.patterns,
      firstDetected: now,
      lastUpdated: now,
      dateRange: {
        start: now,
        end: now
      },
      actionRequired: data.severity === InsightSeverity.CRITICAL || data.severity === InsightSeverity.HIGH,
      createdAt: now,
      updatedAt: now,
      // Store additional metadata as a custom property (will be preserved as Partial<IInsight>)
      ...data.metadata ? { metadata: data.metadata } : {}
    };
  }
  
  // ========== CUSTOMER BEHAVIOR INSIGHTS ==========
  
  private async analyzeChurnRiskPatterns(tickets: ITicketAnalytics[], filters?: any): Promise<Partial<IInsight>[]> {
    const churnRiskTickets = tickets.filter(t => t.churnRisk);
    
    if (churnRiskTickets.length < 2) return [];
    
    // Group by customer segment
    const segmentRisk = this.groupByField(churnRiskTickets, 'customerSegment');
    const insights: Partial<IInsight>[] = [];
    
    for (const [segment, segmentTickets] of Object.entries(segmentRisk)) {
      if (segmentTickets.length >= 2) {
        const avgSatisfaction = this.calculateAverage(segmentTickets, 'satisfactionPrediction');
        const commonReasons = this.extractCommonKeywords(segmentTickets);
        
        insights.push(this.createInsight({
          type: InsightType.CHURN_RISK,
          title: `High churn risk detected in ${segment} segment`,
          description: `${segmentTickets.length} customers at risk of churning. Common issues: ${commonReasons.slice(0, 3).join(', ')}`,
          severity: segmentTickets.length >= 5 ? InsightSeverity.CRITICAL : InsightSeverity.HIGH,
          category: InsightCategory.CUSTOMER_RETENTION,
          confidence: 0.8 + (segmentTickets.length * 0.02),
          frequency: segmentTickets.length,
          keywords: commonReasons,
          ticketIds: segmentTickets.map(t => t.externalTicketId),
          patterns: [`churn_risk_${segment}`],
          organization: filters?.organization,
          productId: filters?.productId,
          metadata: {
            customerSegment: segment,
            avgSatisfactionPrediction: avgSatisfaction,
            riskFactors: this.analyzeChurnRiskFactors(segmentTickets)
          }
        }));
      }
    }
    
    return insights;
  }
  
  private async analyzeEscalationPatterns(tickets: ITicketAnalytics[], filters?: any) {
    const escalationTickets = tickets.filter(t => t.likelyToEscalate || t.isEscalated);
    
    if (escalationTickets.length < 3) return [];
    
    // Analyze patterns in escalation triggers
    const escalationTriggers = this.analyzeEscalationTriggers(escalationTickets);
    const avgEscalationRisk = this.calculateAverage(escalationTickets, 'escalationRisk');
    
    return [{
      type: InsightType.ESCALATION_PATTERN,
      title: 'Escalation pattern detected',
      description: `${escalationTickets.length} tickets showing escalation patterns. Key triggers: ${escalationTriggers.join(', ')}`,
      severity: avgEscalationRisk > 0.7 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
      category: InsightCategory.OPERATIONAL,
      confidence: 0.75 + (escalationTickets.length * 0.02),
      frequency: escalationTickets.length,
      keywords: escalationTriggers,
      ticketIds: escalationTickets.map(t => t.externalTicketId),
      patterns: ['escalation_risk'],
      metadata: {
        avgEscalationRisk,
        triggers: escalationTriggers,
        preventionOpportunities: this.identifyEscalationPrevention(escalationTickets)
      }
    }];
  }
  
  private async analyzeCustomerJourneyIssues(tickets: ITicketAnalytics[], filters?: any): Promise<Partial<IInsight>[]> {
    const journeyIssues = this.groupByField(tickets, 'customerJourneyStage');
    const insights: Partial<IInsight>[] = [];
    
    for (const [stage, stageTickets] of Object.entries(journeyIssues)) {
      if (stageTickets.length >= 3) {
        const commonIssues = this.extractCommonKeywords(stageTickets);
        const avgSatisfaction = this.calculateAverage(stageTickets, 'satisfactionPrediction');
        
        let severity = InsightSeverity.MEDIUM;
        if (stage === 'churning' || avgSatisfaction < 4) severity = InsightSeverity.HIGH;
        if (stage === 'onboarding' && stageTickets.length >= 5) severity = InsightSeverity.HIGH;
        
        insights.push(this.createInsight({
          type: InsightType.CUSTOMER_JOURNEY_ISSUE,
          title: `Issues detected in ${stage} customer journey stage`,
          description: `${stageTickets.length} customers experiencing issues during ${stage}. Common problems: ${commonIssues.slice(0, 3).join(', ')}`,
          severity,
          category: InsightCategory.USER_EXPERIENCE,
          confidence: 0.7 + (stageTickets.length * 0.02),
          frequency: stageTickets.length,
          keywords: commonIssues,
          ticketIds: stageTickets.map(t => t.externalTicketId),
          patterns: [`journey_${stage}`],
          organization: filters?.organization,
          productId: filters?.productId,
          metadata: {
            journeyStage: stage,
            avgSatisfaction,
            interventionOpportunities: this.identifyJourneyInterventions(stage, stageTickets)
          }
        }));
      }
    }
    
    return insights;
  }
  
  // ========== OPERATIONAL INTELLIGENCE ==========
  
  private async analyzeWorkloadImbalances(tickets: ITicketAnalytics[], filters?: any) {
    const workloadDistribution = this.groupByField(tickets, 'workloadImpact');
    const highWorkloadTickets = tickets.filter(t => t.workloadImpact === 'high');
    
    if (highWorkloadTickets.length < 5) return [];
    
    const avgComplexity = this.calculateAverage(highWorkloadTickets, 'complexityScore');
    const peakTimes = this.analyzePeakTimes(highWorkloadTickets);
    
    return [{
      type: InsightType.AGENT_WORKLOAD_IMBALANCE,
      title: 'High workload impact detected',
      description: `${highWorkloadTickets.length} tickets requiring high workload impact. Average complexity: ${avgComplexity.toFixed(1)}`,
      severity: highWorkloadTickets.length >= 10 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
      category: InsightCategory.RESOURCE_OPTIMIZATION,
      confidence: 0.8,
      frequency: highWorkloadTickets.length,
      keywords: this.extractCommonKeywords(highWorkloadTickets),
      ticketIds: highWorkloadTickets.map(t => t.externalTicketId),
      patterns: ['high_workload'],
      metadata: {
        avgComplexity,
        peakTimes,
        resourceRecommendations: this.generateResourceRecommendations(highWorkloadTickets)
      }
    }];
  }
  
  private async analyzeResolutionTimeAnomalies(tickets: ITicketAnalytics[], filters?: any) {
    const resolvedTickets = tickets.filter(t => t.resolutionTime);
    if (resolvedTickets.length < 10) return [];
    
    const avgResolutionTime = this.calculateAverage(resolvedTickets, 'resolutionTime');
    const anomalies = resolvedTickets.filter(t => 
      t.resolutionTime! > avgResolutionTime * 2 || t.resolutionTime! < avgResolutionTime * 0.3
    );
    
    if (anomalies.length < 3) return [];
    
    return [{
      type: InsightType.RESOLUTION_TIME_ANOMALY,
      title: 'Resolution time anomalies detected',
      description: `${anomalies.length} tickets with unusual resolution times (avg: ${avgResolutionTime.toFixed(0)} min)`,
      severity: InsightSeverity.MEDIUM,
      category: InsightCategory.OPERATIONAL,
      confidence: 0.75,
      frequency: anomalies.length,
      keywords: this.extractCommonKeywords(anomalies),
      ticketIds: anomalies.map(t => t.externalTicketId),
      patterns: ['resolution_anomaly'],
      metadata: {
        avgResolutionTime,
        anomalyFactors: this.analyzeAnomalyFactors(anomalies)
      }
    }];
  }
  
  private async analyzeComplexitySurges(tickets: ITicketAnalytics[], filters?: any) {
    const highComplexityTickets = tickets.filter(t => t.complexityScore >= 8);
    
    if (highComplexityTickets.length < 5) return [];
    
    const recentSurge = this.detectRecentSurge(highComplexityTickets);
    if (!recentSurge) return [];
    
    return [{
      type: InsightType.COMPLEXITY_SURGE,
      title: 'Complexity surge detected',
      description: `Surge in high-complexity tickets: ${highComplexityTickets.length} tickets with complexity 8+`,
      severity: InsightSeverity.HIGH,
      category: InsightCategory.RESOURCE_OPTIMIZATION,
      confidence: 0.8,
      frequency: highComplexityTickets.length,
      keywords: this.extractCommonKeywords(highComplexityTickets),
      ticketIds: highComplexityTickets.map(t => t.externalTicketId),
      patterns: ['complexity_surge'],
      metadata: {
        surgeFactors: this.analyzeComplexityFactors(highComplexityTickets),
        resourceNeeds: this.estimateResourceNeeds(highComplexityTickets)
      }
    }];
  }
  
  private async analyzeSpecialistDemand(tickets: ITicketAnalytics[], filters?: any): Promise<Partial<IInsight>[]> {
    const specialistTickets = tickets.filter(t => t.requiresSpecialist);
    
    if (specialistTickets.length < 3) return [];
    
    const specialistAreas = this.groupByField(specialistTickets, 'topics');
    const insights: Partial<IInsight>[] = [];
    
    for (const [area, areaTickets] of Object.entries(specialistAreas)) {
      if (areaTickets.length >= 2) {
        insights.push(this.createInsight({
          type: InsightType.SPECIALIST_DEMAND,
          title: `Specialist demand in ${area}`,
          description: `${areaTickets.length} tickets requiring specialist expertise in ${area}`,
          severity: areaTickets.length >= 5 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
          category: InsightCategory.RESOURCE_OPTIMIZATION,
          confidence: 0.8,
          frequency: areaTickets.length,
          keywords: [area, ...this.extractCommonKeywords(areaTickets)],
          ticketIds: areaTickets.map(t => t.externalTicketId),
          patterns: [`specialist_${area}`],
          organization: filters?.organization,
          productId: filters?.productId,
          metadata: {
            specialistArea: area,
            skillGap: this.assessSkillGap(areaTickets),
            trainingRecommendations: this.generateTrainingRecommendations(area, areaTickets)
          }
        }));
      }
    }
    
    return insights;
  }
  
  // ========== BUSINESS INTELLIGENCE ==========
  
  private async analyzeRevenueImpactAlerts(tickets: ITicketAnalytics[], filters?: any) {
    const revenueImpactTickets = tickets.filter(t => 
      t.revenueImpact === 'high' || t.revenueImpact === 'critical'
    );
    
    if (revenueImpactTickets.length < 3) return [];
    
    const criticalTickets = revenueImpactTickets.filter(t => t.revenueImpact === 'critical');
    const commonCauses = this.extractCommonKeywords(revenueImpactTickets);
    
    return [{
      type: InsightType.REVENUE_IMPACT_ALERT,
      title: 'Revenue impact alerts detected',
      description: `${revenueImpactTickets.length} tickets with significant revenue impact (${criticalTickets.length} critical)`,
      severity: criticalTickets.length > 0 ? InsightSeverity.CRITICAL : InsightSeverity.HIGH,
      category: InsightCategory.REVENUE_PROTECTION,
      confidence: 0.85,
      frequency: revenueImpactTickets.length,
      keywords: commonCauses,
      ticketIds: revenueImpactTickets.map(t => t.externalTicketId),
      patterns: ['revenue_impact'],
      metadata: {
        criticalCount: criticalTickets.length,
        impactAreas: this.analyzeRevenueImpactAreas(revenueImpactTickets),
        protectionStrategies: this.generateRevenueProtectionStrategies(revenueImpactTickets)
      }
    }];
  }
  
  private async analyzeCompetitorThreats(tickets: ITicketAnalytics[], filters?: any) {
    const competitorTickets = tickets.filter(t => t.competitorMentioned);
    
    if (competitorTickets.length < 2) return [];
    
    const threats = this.analyzeCompetitorMentions(competitorTickets);
    
    return [{
      type: InsightType.COMPETITOR_THREAT,
      title: 'Competitor threats identified',
      description: `${competitorTickets.length} tickets mentioning competitors or alternatives`,
      severity: competitorTickets.length >= 5 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
      category: InsightCategory.COMPETITIVE_ANALYSIS,
      confidence: 0.8,
      frequency: competitorTickets.length,
      keywords: this.extractCommonKeywords(competitorTickets),
      ticketIds: competitorTickets.map(t => t.externalTicketId),
      patterns: ['competitor_threat'],
      metadata: {
        threatAreas: threats.areas,
        competitorAdvantages: threats.advantages,
        retentionStrategies: this.generateRetentionStrategies(competitorTickets)
      }
    }];
  }
  
  private async analyzePricingConcerns(tickets: ITicketAnalytics[], filters?: any) {
    const pricingTickets = tickets.filter(t => t.priceRelated);
    
    if (pricingTickets.length < 3) return [];
    
    const concerns = this.analyzePricingFeedback(pricingTickets);
    const avgSatisfaction = this.calculateAverage(pricingTickets, 'satisfactionPrediction');
    
    return [{
      type: InsightType.PRICING_CONCERN,
      title: 'Pricing concerns identified',
      description: `${pricingTickets.length} tickets related to pricing (avg satisfaction: ${avgSatisfaction.toFixed(1)})`,
      severity: avgSatisfaction < 5 ? InsightSeverity.HIGH : InsightSeverity.MEDIUM,
      category: InsightCategory.BUSINESS_INTELLIGENCE,
      confidence: 0.8,
      frequency: pricingTickets.length,
      keywords: this.extractCommonKeywords(pricingTickets),
      ticketIds: pricingTickets.map(t => t.externalTicketId),
      patterns: ['pricing_concern'],
      metadata: {
        avgSatisfaction,
        pricingFeedback: concerns,
        optimizationOpportunities: this.identifyPricingOptimizations(pricingTickets)
      }
    }];
  }
  
  private async analyzeUpsellOpportunities(tickets: ITicketAnalytics[], filters?: any) {
    const upsellTickets = tickets.filter(t => t.upsellOpportunity);
    
    if (upsellTickets.length < 2) return [];
    
    const opportunities = this.categorizeUpsellOpportunities(upsellTickets);
    
    return [{
      type: InsightType.UPSELL_OPPORTUNITY,
      title: 'Upsell opportunities identified',
      description: `${upsellTickets.length} tickets showing upsell potential`,
      severity: InsightSeverity.LOW, // Positive opportunity
      category: InsightCategory.BUSINESS_INTELLIGENCE,
      confidence: 0.7,
      frequency: upsellTickets.length,
      keywords: this.extractCommonKeywords(upsellTickets),
      ticketIds: upsellTickets.map(t => t.externalTicketId),
      patterns: ['upsell_opportunity'],
      metadata: {
        opportunityTypes: opportunities,
        revenueEstimate: this.estimateUpsellRevenue(upsellTickets),
        conversionStrategies: this.generateUpsellStrategies(upsellTickets)
      }
    }];
  }
  
  // ========== HELPER METHODS ==========
  
  private groupByField(tickets: ITicketAnalytics[], field: keyof ITicketAnalytics): Record<string, ITicketAnalytics[]> {
    return tickets.reduce((groups, ticket) => {
      const key = String(ticket[field] || 'unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(ticket);
      return groups;
    }, {} as Record<string, ITicketAnalytics[]>);
  }
  
  private calculateAverage(tickets: ITicketAnalytics[], field: keyof ITicketAnalytics): number {
    const values = tickets.map(t => Number(t[field])).filter(v => !isNaN(v));
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  private extractCommonKeywords(tickets: ITicketAnalytics[]): string[] {
    const allKeywords = tickets.flatMap(t => t.keywords || []);
    const keywordCounts = allKeywords.reduce((counts, keyword) => {
      counts[keyword] = (counts[keyword] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }
  
  private analyzeChurnRiskFactors(tickets: ITicketAnalytics[]) {
    const factors = {
      sentiment: tickets.filter(t => t.sentiment === 'negative').length,
      escalation: tickets.filter(t => t.isEscalated).length,
      satisfaction: this.calculateAverage(tickets, 'satisfactionPrediction'),
      complexity: this.calculateAverage(tickets, 'complexityScore')
    };
    
    return factors;
  }
  
  private analyzeEscalationTriggers(tickets: ITicketAnalytics[]): any[] {
    const triggers: any[] = [];
    
    if (tickets.filter(t => t.sentiment === 'negative').length > tickets.length * 0.6) {
      triggers.push('negative_sentiment');
    }
    
    if (tickets.filter(t => t.businessCriticality >= 7).length > tickets.length * 0.4) {
      triggers.push('business_critical');
    }
    
    if (tickets.filter(t => t.complexityScore >= 8).length > tickets.length * 0.3) {
      triggers.push('high_complexity');
    }
    
    return triggers;
  }
  
  private identifyEscalationPrevention(tickets: ITicketAnalytics[]): any[] {
    const prevention: any[] = [];
    
    if (tickets.filter(t => t.responseExpectation === 'immediate').length > tickets.length * 0.5) {
      prevention.push('faster_response_times');
    }
    
    if (tickets.filter(t => t.documentationGap).length > tickets.length * 0.3) {
      prevention.push('improved_documentation');
    }
    
    if (tickets.filter(t => t.requiresSpecialist).length > tickets.length * 0.4) {
      prevention.push('specialist_routing');
    }
    
    return prevention;
  }
  
  private identifyJourneyInterventions(stage: string, tickets: ITicketAnalytics[]): any[] {
    const interventions: any[] = [];
    
    switch (stage) {
      case 'onboarding':
        interventions.push('improved_onboarding_docs');
        interventions.push('customer_success_intervention');
        break;
      case 'at_risk':
        interventions.push('customer_success_intervention');
        interventions.push('retention_campaign');
        break;
      case 'churning':
        interventions.push('retention_campaign');
        break;
    }
    
    return interventions;
  }
  
  private analyzePeakTimes(tickets: ITicketAnalytics[]): string[] {
    // Simple peak time analysis - would be more sophisticated in production
    const hourCounts = tickets.reduce((counts, ticket) => {
      const hour = new Date(ticket.createdAt).getHours();
      counts[hour] = (counts[hour] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    return peakHours;
  }
  
  private generateResourceRecommendations(tickets: ITicketAnalytics[]): any[] {
    const recommendations: any[] = [];
    
    const avgComplexity = this.calculateAverage(tickets, 'complexityScore');
    if (avgComplexity >= 8) {
      recommendations.push('hire_senior_engineers');
    }
    
    if (tickets.filter(t => t.requiresSpecialist).length > tickets.length * 0.5) {
      recommendations.push('specialist_team_expansion');
    }
    
    return recommendations;
  }
  
  private detectRecentSurge(tickets: ITicketAnalytics[]): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTickets = tickets.filter(t => new Date(t.createdAt) > oneDayAgo);
    
    return recentTickets.length >= tickets.length * 0.5; // 50% of tickets in last 24h
  }
  
  private analyzeComplexityFactors(tickets: ITicketAnalytics[]): any[] {
    const factors: any[] = [];
    
    if (tickets.filter(t => t.integrationRelated).length > tickets.length * 0.5) {
      factors.push('integration_issues');
    }
    
    if (tickets.filter(t => t.technicalComplexity >= 8).length > tickets.length * 0.4) {
      factors.push('technical_complexity');
    }
    
    return factors;
  }
  
  private estimateResourceNeeds(tickets: ITicketAnalytics[]): any {
    return {
      additionalAgents: Math.ceil(tickets.length / 10),
      specialistHours: tickets.filter(t => t.requiresSpecialist).length * 2,
      trainingHours: tickets.length * 0.5
    };
  }
  
  private assessSkillGap(tickets: ITicketAnalytics[]): string {
    const avgComplexity = this.calculateAverage(tickets, 'technicalComplexity');
    if (avgComplexity >= 8) return 'high';
    if (avgComplexity >= 6) return 'medium';
    return 'low';
  }
  
  private generateTrainingRecommendations(area: string, tickets: ITicketAnalytics[]): string[] {
    return [`${area}_training`, 'technical_skills_development', 'certification_programs'];
  }
  
  private analyzeRevenueImpactAreas(tickets: ITicketAnalytics[]): string[] {
    const areas = tickets.flatMap(t => t.featuresAffected || []);
    const areaCounts = areas.reduce((counts, area) => {
      counts[area] = (counts[area] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(areaCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([area]) => area);
  }
  
  private generateRevenueProtectionStrategies(tickets: ITicketAnalytics[]): string[] {
    return [
      'priority_escalation',
      'customer_success_intervention',
      'technical_deep_dive',
      'executive_communication'
    ];
  }
  
  private analyzeCompetitorMentions(tickets: ITicketAnalytics[]): any {
    return {
      areas: this.extractCommonKeywords(tickets).slice(0, 3),
      advantages: ['feature_gaps', 'pricing_comparison', 'user_experience']
    };
  }
  
  private generateRetentionStrategies(tickets: ITicketAnalytics[]): string[] {
    return [
      'competitive_analysis',
      'feature_roadmap_acceleration',
      'pricing_review',
      'customer_success_outreach'
    ];
  }
  
  private analyzePricingFeedback(tickets: ITicketAnalytics[]): any {
    return {
      concerns: ['too_expensive', 'value_perception', 'competitor_pricing'],
      sentiment: this.calculateAverage(tickets, 'satisfactionPrediction')
    };
  }
  
  private identifyPricingOptimizations(tickets: ITicketAnalytics[]): string[] {
    return [
      'pricing_tier_review',
      'value_communication',
      'competitive_pricing_analysis',
      'discount_programs'
    ];
  }
  
  private categorizeUpsellOpportunities(tickets: ITicketAnalytics[]): any[] {
    const opportunities: any[] = [];
    
    if (tickets.filter(t => t.featuresAffected?.includes('enterprise')).length > 0) {
      opportunities.push('enterprise_upgrade');
    }
    
    if (tickets.filter(t => t.integrationRelated).length > 0) {
      opportunities.push('integration_services');
    }
    
    return opportunities;
  }
  
  private estimateUpsellRevenue(tickets: ITicketAnalytics[]): number {
    // Simple estimation - would be more sophisticated in production
    return tickets.length * 500; // $500 average upsell per opportunity
  }
  
  private generateUpsellStrategies(tickets: ITicketAnalytics[]): string[] {
    return [
      'targeted_outreach',
      'feature_demonstrations',
      'trial_extensions',
      'custom_proposals'
    ];
  }
  
  private calculateOverallConfidence(insights: Partial<IInsight>[], ticketCount: number): number {
    if (insights.length === 0) return 0;
    
    const avgInsightConfidence = insights.reduce((sum, insight) => sum + (insight.confidence || 0), 0) / insights.length;
    const volumeBonus = Math.min(0.2, ticketCount / 100); // Bonus for larger datasets
    
    return Math.min(0.95, avgInsightConfidence + volumeBonus);
  }
  
  private generateAdvancedRecommendations(insights: Partial<IInsight>[]): string[] {
    const recommendations = new Set<string>();
    
    // Add recommendations based on insight types
    insights.forEach(insight => {
      if (insight.metadata?.resourceRecommendations) {
        insight.metadata.resourceRecommendations.forEach((rec: string) => recommendations.add(rec));
      }
      if (insight.metadata?.interventionOpportunities) {
        insight.metadata.interventionOpportunities.forEach((rec: string) => recommendations.add(rec));
      }
      if (insight.metadata?.protectionStrategies) {
        insight.metadata.protectionStrategies.forEach((rec: string) => recommendations.add(rec));
      }
    });
    
    // Add strategic recommendations
    if (insights.some(i => i.severity === InsightSeverity.CRITICAL)) {
      recommendations.add('executive_review_required');
    }
    
    if (insights.filter(i => i.category === InsightCategory.CUSTOMER_RETENTION).length >= 2) {
      recommendations.add('customer_retention_strategy_review');
    }
    
    return Array.from(recommendations);
  }
  
  private analyzeAnomalyFactors(tickets: ITicketAnalytics[]): any[] {
    const factors: any[] = [];
    
    if (tickets.filter(t => t.complexityScore >= 8).length > tickets.length * 0.4) {
      factors.push('high_complexity');
    }
    
    if (tickets.filter(t => t.category === 'technical_issues').length > tickets.length * 0.5) {
      factors.push('technical_issues');
    }
    
    if (tickets.filter(t => t.requiresSpecialist).length > tickets.length * 0.3) {
      factors.push('specialist_required');
    }
    
    return factors;
  }
  
  // Placeholder methods for remaining insight types
  private async analyzeDocumentationGaps(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeTrainingOpportunities(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeProcessImprovements(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeCommunicationMismatches(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeEmotionalIntensitySpikes(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeSatisfactionDeclinePredictions(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeSeasonalSurgePredictions(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeMarketFeedback(tickets: ITicketAnalytics[], filters?: any) { return []; }
  private async analyzeProductRoadmapSignals(tickets: ITicketAnalytics[], filters?: any) { return []; }
}

export const advancedInsightsService = new AdvancedInsightsService(); 