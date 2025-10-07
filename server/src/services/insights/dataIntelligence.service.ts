import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HealthScoreService } from '../../services/insights/healthScore.service';
import QdrantService from '../../qdrant/service';
import { CustomerModel } from '../../schemas/customer.schema';
import { UserContextManager } from '../../context/userContext';

export interface DataIntelligenceMetrics {
  // Customer Portfolio Overview
  portfolio: {
    totalCustomers: number;
    healthyCustomers: number; // Score >= 70
    atRiskCustomers: number; // Score 40-69
    criticalCustomers: number; // Score < 40
    averageHealthScore: number;
  };

  // Support Intelligence
  supportIntelligence: {
    totalTickets: number;
    avgResolutionTime: number;
    escalationRate: number;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    topIssues: Array<{
      issue: string;
      frequency: number;
      impact: 'high' | 'medium' | 'low';
    }>;
  };

  // Predictive Insights
  predictiveInsights: {
    churnRisk: {
      high: number;
      medium: number;
      low: number;
    };
    expansionOpportunities: number;
    upcomingRenewals: number;
    supportLoadForecast: {
      nextWeek: number;
      nextMonth: number;
    };
  };

  // Business Impact
  businessImpact: {
    totalContractValue: number;
    atRiskRevenue: number;
    expansionPotential: number;
    customerLifetimeValue: number;
  };
}

export class DataIntelligenceService {
  private healthScoreService: HealthScoreService;
  private qdrantService: QdrantService;

  constructor() {
    this.healthScoreService = new HealthScoreService();
    this.qdrantService = new QdrantService();
  }

  /**
   * Get comprehensive data intelligence metrics for an organization
   */
  async getDataIntelligenceMetrics(): Promise<DataIntelligenceMetrics> {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    
    // Organization ID is already validated as string in user context
    
    console.log(`[Data Intelligence] 📊 Generating metrics for organization ${organizationId}`);

    // Get all customers for the organization
    const customers = await CustomerModel.find({ organizationId: organizationId });
    
    // Calculate health scores for all customers
    const customerHealthScores = await Promise.all(
      customers.map(async (customer) => {
        try {
          const healthScore = await this.healthScoreService.calculateHealthScore(
            customer._id.toString(), 
            organizationId
          );
          
          // Generate health score risk insights if customer is at risk
          try {
            const healthScoreRiskInsights = await this.healthScoreService.generateHealthScoreRiskInsights(
              customer._id.toString(), 
              organizationId, 
              healthScore
            );
            console.log(`[Data Intelligence] Generated ${healthScoreRiskInsights.length} health score risk insights for customer ${customer._id}`);
          } catch (error) {
            console.error(`[Data Intelligence] Error generating health score risk insights for customer ${customer._id}:`, error);
          }
          
          return {
            customerId: customer._id.toString(),
            healthScore: healthScore.overallScore,
            contractValue: customer.financialMetrics?.contractValue || 0,
            segment: customer.segment
          };
        } catch (error) {
          console.error(`Error calculating health score for customer ${customer._id}:`, error);
          return {
            customerId: customer._id.toString(),
            healthScore: 50, // Default neutral score
            contractValue: customer.financialMetrics?.contractValue || 0,
            segment: customer.segment
          };
        }
      })
    );

    // Calculate portfolio metrics
    const portfolio = this.calculatePortfolioMetrics(customerHealthScores);
    
    // Calculate support intelligence
    const supportIntelligence = await this.calculateSupportIntelligence(organizationId);
    
    // Calculate predictive insights
    const predictiveInsights = await this.calculatePredictiveInsights(organizationId, customerHealthScores);
    
    // Calculate business impact
    const businessImpact = this.calculateBusinessImpact(customerHealthScores);

    return {
      portfolio,
      supportIntelligence,
      predictiveInsights,
      businessImpact
    };
  }

  /**
   * Calculate portfolio metrics
   */
  private calculatePortfolioMetrics(customerHealthScores: any[]): DataIntelligenceMetrics['portfolio'] {
    const totalCustomers = customerHealthScores.length;
    const healthyCustomers = customerHealthScores.filter(c => c.healthScore >= 70).length;
    const atRiskCustomers = customerHealthScores.filter(c => c.healthScore >= 40 && c.healthScore < 70).length;
    const criticalCustomers = customerHealthScores.filter(c => c.healthScore < 40).length;
    const averageHealthScore = totalCustomers > 0 
      ? customerHealthScores.reduce((sum, c) => sum + c.healthScore, 0) / totalCustomers 
      : 0;

    return {
      totalCustomers,
      healthyCustomers,
      atRiskCustomers,
      criticalCustomers,
      averageHealthScore: Math.round(averageHealthScore)
    };
  }

  /**
   * Calculate support intelligence metrics
   */
  private async calculateSupportIntelligence(organizationId: string): Promise<DataIntelligenceMetrics['supportIntelligence']> {
    // Get recent predictions for support metrics from insights collection
    const { getPredictionInsights } = await import('./index');
    const recentPredictions = await getPredictionInsights(organizationId, undefined, 100);

    const totalTickets = recentPredictions.length;
    const escalatedTickets = recentPredictions.filter(p => 
      p.escalationRisk === 'High'
    ).length;
    const escalationRate = totalTickets > 0 ? escalatedTickets / totalTickets : 0;

    // Calculate average resolution time (placeholder - would need actual resolution data)
    const avgResolutionTime = 24; // hours

    // Determine sentiment trend (placeholder - would need historical sentiment data)
    const sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';

    // Top issues (placeholder - would need actual issue analysis)
    const topIssues = [
      { issue: 'Integration Problems', frequency: 15, impact: 'high' as const },
      { issue: 'Performance Issues', frequency: 12, impact: 'medium' as const },
      { issue: 'Billing Questions', frequency: 8, impact: 'low' as const }
    ];

    return {
      totalTickets,
      avgResolutionTime,
      escalationRate: Math.round(escalationRate * 100) / 100,
      sentimentTrend,
      topIssues
    };
  }

  /**
   * Calculate predictive insights
   */
  private async calculatePredictiveInsights(organizationId: string, customerHealthScores: any[]): Promise<DataIntelligenceMetrics['predictiveInsights']> {
    // Churn risk based on health scores
    const highChurnRisk = customerHealthScores.filter(c => c.healthScore < 40).length;
    const mediumChurnRisk = customerHealthScores.filter(c => c.healthScore >= 40 && c.healthScore < 60).length;
    const lowChurnRisk = customerHealthScores.filter(c => c.healthScore >= 60).length;

    // Expansion opportunities (customers with high health scores and high contract values)
    const expansionOpportunities = customerHealthScores.filter(c => 
      c.healthScore >= 80 && c.contractValue >= 50000
    ).length;

    // Upcoming renewals (placeholder - would need actual renewal data)
    const upcomingRenewals = Math.floor(customerHealthScores.length * 0.1); // 10% of customers

    // Support load forecast (placeholder - would need historical ticket data)
    const supportLoadForecast = {
      nextWeek: Math.floor(customerHealthScores.length * 0.05), // 5% of customers
      nextMonth: Math.floor(customerHealthScores.length * 0.2) // 20% of customers
    };

    return {
      churnRisk: {
        high: highChurnRisk,
        medium: mediumChurnRisk,
        low: lowChurnRisk
      },
      expansionOpportunities,
      upcomingRenewals,
      supportLoadForecast
    };
  }

  /**
   * Calculate business impact metrics
   */
  private calculateBusinessImpact(customerHealthScores: any[]): DataIntelligenceMetrics['businessImpact'] {
    const totalContractValue = customerHealthScores.reduce((sum, c) => sum + c.contractValue, 0);
    
    const atRiskRevenue = customerHealthScores
      .filter(c => c.healthScore < 60)
      .reduce((sum, c) => sum + c.contractValue, 0);
    
    const expansionPotential = customerHealthScores
      .filter(c => c.healthScore >= 80)
      .reduce((sum, c) => sum + c.contractValue * 0.3, 0); // 30% expansion potential
    
    const customerLifetimeValue = totalContractValue / customerHealthScores.length;

    return {
      totalContractValue,
      atRiskRevenue,
      expansionPotential,
      customerLifetimeValue: Math.round(customerLifetimeValue)
    };
  }

  /**
   * Get customer-specific data intelligence
   */
  async getCustomerDataIntelligence(customerId: string, organizationId: string): Promise<{
    healthScore: any;
    ticketAnalytics: any;
    predictiveInsights: any;
    recommendations: string[];
  }> {
    // Get health score
    const healthScore = await this.healthScoreService.calculateHealthScore(customerId, organizationId);
    
    // Generate health score risk insights if customer is at risk
    try {
      const healthScoreRiskInsights = await this.healthScoreService.generateHealthScoreRiskInsights(
        customerId, 
        organizationId, 
        healthScore
      );
      console.log(`[Customer Data Intelligence] Generated ${healthScoreRiskInsights.length} health score risk insights for customer ${customerId}`);
    } catch (error) {
      console.error(`[Customer Data Intelligence] Error generating health score risk insights for customer ${customerId}:`, error);
    }
    
    // Get ticket analytics
    const ticketStats = await this.qdrantService.getCustomerTicketStats(customerId);
    
    // Get predictive insights from insights collection
    const { getPredictionInsights } = await import('./index');
    const recentPredictions = await getPredictionInsights(organizationId, customerId, 10);

    // Generate recommendations
    const recommendations = await this.healthScoreService.getHealthScoreInsights(healthScore);

    return {
      healthScore,
      ticketAnalytics: ticketStats,
      predictiveInsights: recentPredictions,
      recommendations
    };
  }
}

export default DataIntelligenceService;
