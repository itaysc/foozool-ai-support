import { BotPerformanceMetricModel } from '../../schemas/botPerformanceMetric.schema';
import { BotPerformanceTracker } from './tracking.service';
import { BotPerformanceCacheService } from './cache.service';
import { TicketModel } from '../../schemas/ticket.schema';
import { ActionLogModel } from '../../schemas/actionLog.schema';
import cron from 'node-cron';
import mongoose from 'mongoose';

interface ActionableInsight {
  type: string;
  severity: string;
  title: string;
  description: string;
  suggestions: string[];
  impact: string;
}

export class BotMetricsService {
  private static isScheduled = false;

  /**
   * Initialize the bot metrics service
   */
  static initialize(): void {
    if (!this.isScheduled) {
      this.scheduleDailyMetrics();
      this.isScheduled = true;
      console.log('🤖 Bot Metrics Service initialized');
    }
  }
  
  /**
   * Schedule daily metrics calculation
   * Runs every day at 1 AM
   */
  static scheduleDailyMetrics(): void {
    // Run at 1 AM every day
    cron.schedule('0 1 * * *', async () => {
      console.log('🤖 Running scheduled daily bot metrics calculation...');
      await this.calculateAllOrganizationsMetrics();
    });
    
    // Also run a quick calculation every 6 hours for near real-time updates
    cron.schedule('0 */6 * * *', async () => {
      console.log('🤖 Running 6-hourly bot metrics update...');
      await this.calculateAllOrganizationsMetrics(new Date());
    });
    
    console.log('✅ Daily bot metrics calculation scheduled (1 AM daily + 6-hourly updates)');
  }

  /**
   * Calculate metrics for all organizations
   */
  static async calculateAllOrganizationsMetrics(date: Date = new Date()): Promise<void> {
    try {
      // Get all unique organizations from recent tickets
      const organizations = await this.getActiveOrganizations();
      
      console.log(`Calculating bot metrics for ${organizations.length} organizations`);
      
      for (const orgId of organizations) {
        try {
          await BotPerformanceTracker.calculateDailyMetrics(orgId, date);
          // Invalidate cache after metrics update
          await BotPerformanceCacheService.invalidateAfterMetricsUpdate(orgId);
        } catch (error) {
          console.error(`Failed to calculate metrics for org ${orgId}:`, error);
        }
      }
      
      console.log('✅ Completed daily metrics calculation for all organizations');
    } catch (error) {
      console.error('❌ Failed to calculate daily metrics:', error);
    }
  }

  /**
   * Get bot performance dashboard data
   */
  static async getDashboardData(
    organizationId: string,
    days: number = 30
  ) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get performance summary
      const summary = await BotPerformanceTracker.getPerformanceSummary(
        organizationId,
        startDate,
        endDate
      );

      // Get daily metrics for charts
      const dailyMetrics = await BotPerformanceMetricModel.find({
        organization: organizationId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      // Calculate trends
      const trends = this.calculateTrends(dailyMetrics);

      // Format data for dashboard
      const dashboardData = {
        summary,
        trends,
        chartData: {
          ticketVolume: dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            processed: m.totalTicketsProcessed,
            autoResolved: m.ticketsAutoResolved,
            escalated: m.ticketsEscalated
          })),
          successRate: dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            rate: m.successRate
          })),
          responseTime: dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            avgTime: m.avgResponseTime
          })),
          customerSatisfaction: dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            score: m.customerSatisfactionImpact
          })),
          costSavings: dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            savings: m.estimatedCostSavings
          }))
        },
        kpis: {
          totalTicketsProcessed: summary.totalTickets,
          avgSuccessRate: summary.avgSuccessRate,
          avgResponseTime: summary.avgResponseTime,
          totalCostSavings: summary.totalCostSavings,
          avgCustomerSatisfaction: summary.avgCustomerSatisfaction
        }
      };

      return dashboardData;
    } catch (error) {
      console.error('Failed to get bot dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get actionable insights based on bot performance
   */
  static async getActionableInsights(organizationId: string) {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const metrics = await BotPerformanceMetricModel.find({
        organization: organizationId,
        date: { $gte: lastWeek }
      }).sort({ date: -1 });

      if (metrics.length === 0) {
        return [];
      }

      const insights: ActionableInsight[] = [];
      const latestMetric = metrics[0];
      const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;

      // Low success rate insight
      if (avgSuccessRate < 60) {
        insights.push({
          type: 'performance_issue',
          severity: 'high',
          title: 'Low Bot Success Rate Detected',
          description: `Your bot's success rate is ${avgSuccessRate.toFixed(1)}%, which is below the recommended 70%+`,
          suggestions: [
            'Review and update action thresholds',
            'Improve intent classification training',
            'Add more similar ticket examples',
            'Consider adjusting confidence score requirements'
          ],
          impact: 'High customer dissatisfaction and increased human workload'
        });
      }

      // High response time insight
      if (avgResponseTime > 5000) { // > 5 seconds
        insights.push({
          type: 'performance_issue',
          severity: 'medium',
          title: 'Slow Bot Response Times',
          description: `Average response time is ${(avgResponseTime/1000).toFixed(1)} seconds`,
          suggestions: [
            'Optimize similar ticket search parameters',
            'Review LLM prompt length and complexity',
            'Consider caching frequently used responses',
            'Monitor system resource usage'
          ],
          impact: 'Delayed customer responses and poor user experience'
        });
      }

      // High escalation rate insight
      if (latestMetric.escalationRate > 40) {
        insights.push({
          type: 'escalation_issue',
          severity: 'medium',
          title: 'High Escalation Rate',
          description: `${latestMetric.escalationRate.toFixed(1)}% of tickets are being escalated to humans`,
          suggestions: [
            'Lower action thresholds for confident responses',
            'Add more autonomous action types',
            'Review escalation triggers and conditions',
            'Improve bot training with more ticket examples'
          ],
          impact: 'Reduced automation benefits and increased human workload'
        });
      }

      // Positive trend insight
      if (metrics.length >= 2) {
        const previousMetric = metrics[1];
        const successRateImprovement = latestMetric.successRate - previousMetric.successRate;
        
        if (successRateImprovement > 5) {
          insights.push({
            type: 'positive_trend',
            severity: 'low',
            title: 'Bot Performance Improving',
            description: `Success rate improved by ${successRateImprovement.toFixed(1)}% from yesterday`,
            suggestions: [
              'Continue current optimization strategy',
              'Document successful changes for future reference',
              'Consider applying similar improvements to other areas'
            ],
            impact: 'Increased customer satisfaction and cost savings'
          });
        }
      }

      // Cost savings opportunity
      const potentialSavings = latestMetric.estimatedCostSavings * 30; // Monthly projection
      if (potentialSavings > 1000) {
        insights.push({
          type: 'business_opportunity',
          severity: 'low',
          title: 'Significant Cost Savings Achieved',
          description: `Bot is saving approximately $${potentialSavings.toFixed(0)} per month`,
          suggestions: [
            'Scale bot implementation to more ticket types',
            'Share success metrics with stakeholders',
            'Invest savings in further automation improvements'
          ],
          impact: 'Substantial operational cost reduction'
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to get actionable insights:', error);
      throw error;
    }
  }

  /**
   * Calculate performance trends
   */
  private static calculateTrends(metrics: any[]) {
    if (metrics.length < 2) {
      return {
        volumeTrend: 'stable',
        successRateTrend: 'stable',
        responseTimeTrend: 'stable',
        satisfactionTrend: 'stable'
      };
    }

    const latest = metrics[metrics.length - 1];
    const previous = metrics[metrics.length - 2];

    const volumeChange = ((latest.totalTicketsProcessed - previous.totalTicketsProcessed) / previous.totalTicketsProcessed) * 100;
    const successRateChange = latest.successRate - previous.successRate;
    const responseTimeChange = ((latest.avgResponseTime - previous.avgResponseTime) / previous.avgResponseTime) * 100;
    const satisfactionChange = latest.customerSatisfactionImpact - previous.customerSatisfactionImpact;

    return {
      volumeTrend: volumeChange > 5 ? 'increasing' : volumeChange < -5 ? 'decreasing' : 'stable',
      successRateTrend: successRateChange > 2 ? 'increasing' : successRateChange < -2 ? 'decreasing' : 'stable',
      responseTimeTrend: responseTimeChange > 10 ? 'increasing' : responseTimeChange < -10 ? 'decreasing' : 'stable',
      satisfactionTrend: satisfactionChange > 0.2 ? 'increasing' : satisfactionChange < -0.2 ? 'decreasing' : 'stable',
      changes: {
        volume: Math.round(volumeChange * 10) / 10,
        successRate: Math.round(successRateChange * 10) / 10,
        responseTime: Math.round(responseTimeChange * 10) / 10,
        satisfaction: Math.round(satisfactionChange * 10) / 10
      }
    };
  }

  /**
   * Get active organizations that have processed tickets recently
   */
  private static async getActiveOrganizations(): Promise<string[]> {
    try {
      // Get organizations from recent performance metrics
      const recentMetrics = await BotPerformanceMetricModel.distinct('organization', {
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      return recentMetrics.map(id => id.toString());
    } catch (error) {
      console.error('Failed to get active organizations:', error);
      return [];
    }
  }
}