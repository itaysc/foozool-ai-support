import { BotPerformanceMetricModel } from '../../schemas/botPerformanceMetric.schema';
import { TicketModel } from '../../schemas/ticket.schema';
import { ActionLogModel } from '../../schemas/actionLog.schema';

interface PerformancePrediction {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
}

type PerformanceRecommendation = {
  type: 'threshold_adjustment' | 'training_improvement' | 'process_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
};

export interface PerformanceAnalytics {
  overallPerformance: {
    totalTicketsProcessed: number;
    averageSuccessRate: number;
    averageResponseTime: number;
    totalCostSavings: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  patterns: {
    peakHours: Array<{ hour: number; ticketCount: number }>;
    seasonality: Array<{ dayOfWeek: string; avgTickets: number }>;
    escalationTriggers: Array<{ trigger: string; frequency: number }>;
  };
  recommendations: Array<{
    type: 'threshold_adjustment' | 'training_improvement' | 'process_optimization';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
  }>;
  predictions: Array<{
    metric: string;
    prediction: number;
    confidence: number;
    timeframe: string;
    reasoning: string;
  }>;
}

export class BotAnalyticsService {
  
  /**
   * Generate comprehensive performance analytics
   */
  static async generateAnalytics(
    organizationId: string,
    days: number = 30
  ): Promise<PerformanceAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get performance metrics
      const metrics = await BotPerformanceMetricModel.find({
        organization: organizationId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      // Get detailed ticket data for pattern analysis
      const tickets = await TicketModel.find({
        organization: organizationId,
        botProcessed: true,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Get action logs for success analysis
      const actionLogs = await ActionLogModel.find({
        organization: organizationId,
        executedAt: { $gte: startDate, $lte: endDate }
      });

      // Generate analytics
      const overallPerformance = this.calculateOverallPerformance(metrics);
      const patterns = this.analyzePatterns(tickets, actionLogs);
      const recommendations = this.generateRecommendations(metrics, tickets, actionLogs);
      const predictions = this.generatePredictions(metrics);

      return {
        overallPerformance,
        patterns,
        recommendations,
        predictions
      };
    } catch (error) {
      console.error('Failed to generate bot analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate overall performance metrics and trends
   */
  private static calculateOverallPerformance(metrics: any[]) {
    if (metrics.length === 0) {
      return {
        totalTicketsProcessed: 0,
        averageSuccessRate: 0,
        averageResponseTime: 0,
        totalCostSavings: 0,
        trend: 'stable' as const
      };
    }

    const totalTicketsProcessed = metrics.reduce((sum, m) => sum + m.totalTicketsProcessed, 0);
    const averageSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
    const totalCostSavings = metrics.reduce((sum, m) => sum + m.estimatedCostSavings, 0);

    // Calculate trend based on recent performance
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (metrics.length >= 7) {
      const recentWeek = metrics.slice(-7);
      const previousWeek = metrics.slice(-14, -7);
      
      if (previousWeek.length > 0) {
        const recentAvgSuccess = recentWeek.reduce((sum, m) => sum + m.successRate, 0) / recentWeek.length;
        const previousAvgSuccess = previousWeek.reduce((sum, m) => sum + m.successRate, 0) / previousWeek.length;
        
        const improvement = recentAvgSuccess - previousAvgSuccess;
        if (improvement > 2) trend = 'improving';
        else if (improvement < -2) trend = 'declining';
      }
    }

    return {
      totalTicketsProcessed,
      averageSuccessRate: Math.round(averageSuccessRate * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime),
      totalCostSavings: Math.round(totalCostSavings * 100) / 100,
      trend
    };
  }

  /**
   * Analyze patterns in bot performance
   */
  private static analyzePatterns(tickets: any[], actionLogs: any[]) {
    // Analyze peak hours
    const hourlyDistribution = new Array(24).fill(0);
    tickets.forEach(ticket => {
      const hour = new Date(ticket.createdAt).getHours();
      hourlyDistribution[hour]++;
    });

    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, ticketCount: count }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 5);

    // Analyze day-of-week patterns
    const dayOfWeekDistribution = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    tickets.forEach(ticket => {
      const dayOfWeek = new Date(ticket.createdAt).getDay();
      dayOfWeekDistribution[dayOfWeek]++;
    });

    const seasonality = dayOfWeekDistribution.map((count, index) => ({
      dayOfWeek: dayNames[index],
      avgTickets: Math.round(count / (tickets.length / 7 || 1))
    }));

    // Analyze escalation triggers
    const escalationReasons = tickets
      .filter(ticket => ticket.escalatedToHuman && ticket.escalationReason)
      .reduce((acc: any, ticket) => {
        const reason = ticket.escalationReason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

    const escalationTriggers = Object.entries(escalationReasons)
      .map(([trigger, frequency]) => ({ trigger, frequency: frequency as number }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      peakHours,
      seasonality,
      escalationTriggers
    };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(metrics: any[], tickets: any[], actionLogs: any[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    if (metrics.length === 0) return recommendations;

    const latestMetric = metrics[metrics.length - 1];
    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
    const avgEscalationRate = metrics.reduce((sum, m) => sum + m.escalationRate, 0) / metrics.length;

    // Low success rate recommendation
    if (avgSuccessRate < 70) {
      recommendations.push({
        type: 'threshold_adjustment' as const,
        priority: 'high' as const,
        title: 'Optimize Action Thresholds',
        description: `Current success rate is ${avgSuccessRate.toFixed(1)}%, below target of 70%+`,
        expectedImpact: `Could improve success rate by 10-15% and reduce escalations`,
        actionItems: [
          'Review confidence score thresholds for autonomous actions',
          'Lower thresholds for high-confidence scenarios',
          'Add more similar ticket examples for training',
          'Implement A/B testing for threshold optimization'
        ]
      });
    }

    // High response time recommendation
    if (avgResponseTime > 5000) {
      recommendations.push({
        type: 'process_optimization' as const,
        priority: 'medium' as const,
        title: 'Improve Response Performance',
        description: `Average response time is ${(avgResponseTime/1000).toFixed(1)}s, target is <3s`,
        expectedImpact: `Reduce response time by 30-40% and improve user experience`,
        actionItems: [
          'Optimize similar ticket search parameters (reduce k value)',
          'Implement response caching for common queries',
          'Review and simplify LLM prompts',
          'Consider upgrading infrastructure resources'
        ]
      });
    }

    // High escalation rate recommendation
    if (avgEscalationRate > 30) {
      recommendations.push({
        type: 'training_improvement' as const,
        priority: 'high' as const,
        title: 'Reduce Escalation Rate',
        description: `${avgEscalationRate.toFixed(1)}% of tickets are escalated, target is <20%`,
        expectedImpact: `Could reduce human workload by 20-30% and improve automation`,
        actionItems: [
          'Analyze common escalation triggers and patterns',
          'Add more training data for frequent escalation scenarios',
          'Implement progressive escalation (bot retry before human)',
          'Create specialized handling for complex ticket types'
        ]
      });
    }

    // False positive recommendation
    if (latestMetric.falsePositiveRate > 10) {
      recommendations.push({
        type: 'training_improvement' as const,
        priority: 'medium' as const,
        title: 'Reduce False Positive Rate',
        description: `${latestMetric.falsePositiveRate}% false positive rate detected`,
        expectedImpact: `Improve customer satisfaction and reduce support follow-ups`,
        actionItems: [
          'Review tickets with negative feedback post-resolution',
          'Implement stricter validation for auto-resolve actions',
          'Add customer confirmation step for sensitive actions',
          'Improve intent classification accuracy'
        ]
      });
    }

    // Positive performance reinforcement
    if (avgSuccessRate > 80 && avgResponseTime < 3000) {
      recommendations.push({
        type: 'process_optimization' as const,
        priority: 'low' as const,
        title: 'Scale Successful Automation',
        description: `Excellent performance: ${avgSuccessRate.toFixed(1)}% success rate, ${(avgResponseTime/1000).toFixed(1)}s response time`,
        expectedImpact: `Expand automation to additional ticket types and channels`,
        actionItems: [
          'Document current successful configuration',
          'Apply successful patterns to other ticket categories',
          'Implement automation for similar workflow processes',
          'Share success metrics with stakeholders for additional investment'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate performance predictions
   */
  private static generatePredictions(metrics: any[]): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = [];

    if (metrics.length < 7) {
      return [{
        metric: 'Insufficient Data',
        prediction: 0,
        confidence: 0,
        timeframe: 'N/A',
        reasoning: 'Need at least 7 days of data for reliable predictions'
      }];
    }

    // Predict success rate trend
    const recentMetrics = metrics.slice(-7);
    const successRates = recentMetrics.map(m => m.successRate);
    const avgSuccessRate = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    
    // Simple linear trend calculation
    const successRateTrend = this.calculateTrend(successRates);
    const predictedSuccessRate = avgSuccessRate + (successRateTrend * 7); // 7 days ahead

    predictions.push({
      metric: 'Success Rate',
      prediction: Math.round(Math.max(0, Math.min(100, predictedSuccessRate)) * 10) / 10,
      confidence: Math.min(90, 60 + (metrics.length * 2)), // Higher confidence with more data
      timeframe: 'Next 7 days',
      reasoning: successRateTrend > 0 
        ? 'Improving trend based on recent performance gains'
        : successRateTrend < 0 
        ? 'Declining trend suggests need for optimization'
        : 'Stable performance expected to continue'
    });

    // Predict ticket volume
    const volumes = recentMetrics.map(m => m.totalTicketsProcessed);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeTrend = this.calculateTrend(volumes);
    const predictedVolume = Math.max(0, avgVolume + (volumeTrend * 7));

    predictions.push({
      metric: 'Daily Ticket Volume',
      prediction: Math.round(predictedVolume),
      confidence: Math.min(85, 50 + (metrics.length * 3)),
      timeframe: 'Next 7 days average',
      reasoning: volumeTrend > 1 
        ? 'Increasing ticket volume trend detected'
        : volumeTrend < -1
        ? 'Decreasing ticket volume trend'
        : 'Stable ticket volume expected'
    });

    // Predict cost savings
    const costSavings = recentMetrics.map(m => m.estimatedCostSavings);
    const avgCostSavings = costSavings.reduce((sum, cost) => sum + cost, 0) / costSavings.length;
    const monthlyCostSavings = avgCostSavings * 30;

    predictions.push({
      metric: 'Monthly Cost Savings',
      prediction: Math.round(monthlyCostSavings * 100) / 100,
      confidence: Math.min(80, 40 + (metrics.length * 4)),
      timeframe: 'Next 30 days',
      reasoning: `Based on current daily average of $${avgCostSavings.toFixed(2)} in automation savings`
    });

    return predictions;
  }

  /**
   * Calculate simple linear trend from array of values
   */
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = values.reduce((sum, _, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Get performance comparison with industry benchmarks
   */
  static async getBenchmarkComparison(organizationId: string) {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const metrics = await BotPerformanceMetricModel.find({
        organization: organizationId,
        date: { $gte: lastWeek }
      });

      if (metrics.length === 0) {
        return {
          successRate: { value: 0, benchmark: 75, status: 'no_data' },
          responseTime: { value: 0, benchmark: 3000, status: 'no_data' },
          escalationRate: { value: 0, benchmark: 25, status: 'no_data' },
          customerSatisfaction: { value: 0, benchmark: 4.0, status: 'no_data' }
        };
      }

      const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
      const avgEscalationRate = metrics.reduce((sum, m) => sum + m.escalationRate, 0) / metrics.length;
      const avgSatisfaction = metrics.reduce((sum, m) => sum + m.customerSatisfactionImpact, 0) / metrics.length;

      // Industry benchmarks (example values)
      const benchmarks = {
        successRate: 75, // 75% industry average
        responseTime: 3000, // 3 seconds
        escalationRate: 25, // 25% escalation rate
        customerSatisfaction: 4.0 // 4.0/5.0 rating
      };

      const getStatus = (value: number, benchmark: number, higherIsBetter: boolean = true) => {
        const diff = higherIsBetter ? value - benchmark : benchmark - value;
        if (diff > benchmark * 0.1) return 'excellent';
        if (diff > 0) return 'good';
        if (diff > -benchmark * 0.1) return 'average';
        return 'below_average';
      };

      return {
        successRate: {
          value: Math.round(avgSuccessRate * 10) / 10,
          benchmark: benchmarks.successRate,
          status: getStatus(avgSuccessRate, benchmarks.successRate, true)
        },
        responseTime: {
          value: Math.round(avgResponseTime),
          benchmark: benchmarks.responseTime,
          status: getStatus(avgResponseTime, benchmarks.responseTime, false)
        },
        escalationRate: {
          value: Math.round(avgEscalationRate * 10) / 10,
          benchmark: benchmarks.escalationRate,
          status: getStatus(avgEscalationRate, benchmarks.escalationRate, false)
        },
        customerSatisfaction: {
          value: Math.round(avgSatisfaction * 10) / 10,
          benchmark: benchmarks.customerSatisfaction,
          status: getStatus(avgSatisfaction, benchmarks.customerSatisfaction, true)
        }
      };
    } catch (error) {
      console.error('Failed to get benchmark comparison:', error);
      throw error;
    }
  }
}