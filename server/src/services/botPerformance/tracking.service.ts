import { TicketModel } from '../../schemas/ticket.schema';
import { ActionLogModel } from '../../schemas/actionLog.schema';
import { BotPerformanceMetricModel } from '../../schemas/botPerformanceMetric.schema';
import { IBotProcessingStep, ITicket } from '../../types';
import { QdrantTicketPoint } from '../../qdrant/schemas/ticket';

export interface BotPerformanceData {
  botProcessed: boolean;
  botResponseGenerated: boolean;
  botResponseTime: number;
  botConfidenceScore: number;
  botActions: string[];
  escalatedToHuman: boolean;
  escalationReason?: string;
  resolutionSource: 'bot' | 'human' | 'hybrid';
  similarTicketsUsed: number;
  processingSteps: IBotProcessingStep[];
  botModelVersion?: string;
  botPromptTemplate?: string;
  botResponseContent?: string;
}

export class BotPerformanceTracker {
  
  /**
   * Track bot performance for a ticket processing session
   */
  static async trackTicketProcessing(
    ticketId: string,
    organizationId: string,
    performanceData: BotPerformanceData
  ): Promise<void> {
    try {
      console.log(`Tracking bot performance for ticket ${ticketId}`);
      
      // Update ticket with bot performance data
      await TicketModel.findOneAndUpdate(
        { externalId: ticketId, organization: organizationId },
        {
          $set: {
            botProcessed: performanceData.botProcessed,
            botResponseGenerated: performanceData.botResponseGenerated,
            botResponseTime: performanceData.botResponseTime,
            botConfidenceScore: performanceData.botConfidenceScore,
            botActions: performanceData.botActions,
            escalatedToHuman: performanceData.escalatedToHuman,
            escalationReason: performanceData.escalationReason,
            resolutionSource: performanceData.resolutionSource,
            similarTicketsUsed: performanceData.similarTicketsUsed,
            processingSteps: performanceData.processingSteps,
            botModelVersion: performanceData.botModelVersion,
            botPromptTemplate: performanceData.botPromptTemplate,
            botResponseContent: performanceData.botResponseContent,
          }
        },
        { upsert: false }
      );
      
      console.log(`✅ Bot performance tracked for ticket ${ticketId}`);
    } catch (error) {
      console.error(`❌ Failed to track bot performance for ticket ${ticketId}:`, error);
      // Don't throw - performance tracking shouldn't break the main flow
    }
  }

  /**
   * Update Qdrant payload with bot performance metadata
   */
  static enhanceQdrantPayload(
    basePayload: any,
    performanceData: BotPerformanceData
  ): any {
    return {
      ...basePayload,
      bot_processed: performanceData.botProcessed,
      bot_actions: performanceData.botActions,
      resolution_source: performanceData.resolutionSource,
      bot_processing_time: performanceData.botResponseTime,
      bot_confidence_score: performanceData.botConfidenceScore,
      escalated_to_human: performanceData.escalatedToHuman,
      bot_model_version: performanceData.botModelVersion || 'gpt-4',
    };
  }

  /**
   * Add a processing step to track the bot's pipeline
   */
  static createProcessingStep(
    step: string,
    success: boolean,
    processingTime: number,
    errorMessage?: string
  ): IBotProcessingStep {
    return {
      step,
      completedAt: new Date(),
      success,
      processingTime,
      errorMessage
    };
  }

  /**
   * Calculate comprehensive daily performance metrics for an organization
   */
  static async calculateDailyMetrics(
    organizationId: string,
    date: Date = new Date()
  ): Promise<void> {
    try {
      // Set date to start of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Calculating comprehensive daily bot metrics for org ${organizationId} on ${startOfDay.toDateString()}`);

      // Get all tickets processed by bot on this day
      const tickets = await TicketModel.find({
        organization: organizationId,
        botProcessed: true,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (tickets.length === 0) {
        console.log(`No bot-processed tickets found for ${startOfDay.toDateString()}`);
        // Still create a metric entry with zeros for tracking
        await this.createEmptyDailyMetric(organizationId, startOfDay);
        return;
      }

      // Get action logs for the same period
      const actionLogs = await ActionLogModel.find({
        organization: organizationId,
        executedAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // Calculate basic ticket metrics
      const basicMetrics = this.calculateBasicTicketMetrics(tickets);

      // Calculate action-specific metrics
      const actionMetrics = this.calculateActionMetrics(actionLogs);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(tickets, actionLogs);

      // Calculate business impact
      const businessMetrics = this.calculateBusinessImpact(tickets, actionLogs);

      // Calculate trends compared to previous day
      const trends = await this.calculateDayOverDayTrends(organizationId, startOfDay, {
        ...basicMetrics,
        ...actionMetrics,
        ...qualityMetrics
      });

      // Create comprehensive daily metric
      const dailyMetric = {
        organization: organizationId,
        date: startOfDay,
        
        // Basic metrics
        ...basicMetrics,
        
        // Action breakdown
        actionBreakdown: actionMetrics,
        
        // Quality metrics
        ...qualityMetrics,
        
        // Business impact
        ...businessMetrics,
        
        // Trends
        trends
      };

      await BotPerformanceMetricModel.findOneAndUpdate(
        { organization: organizationId, date: startOfDay },
        { $set: dailyMetric },
        { upsert: true, new: true }
      );

      console.log(`✅ Comprehensive daily metrics calculated for ${startOfDay.toDateString()}: ${basicMetrics.totalTicketsProcessed} tickets, ${basicMetrics.successRate.toFixed(1)}% success rate, $${businessMetrics.estimatedCostSavings.toFixed(2)} savings`);
    } catch (error) {
      console.error(`❌ Failed to calculate daily metrics:`, error);
    }
  }

  /**
   * Calculate basic ticket processing metrics
   */
  private static calculateBasicTicketMetrics(tickets: any[]) {
    const totalTicketsProcessed = tickets.length;
    const ticketsAutoResolved = tickets.filter(t => t.resolutionSource === 'bot').length;
    const ticketsEscalated = tickets.filter(t => t.escalatedToHuman).length;
    const ticketsWithBotResponse = tickets.filter(t => t.botResponseGenerated).length;
    const hybridResolution = tickets.filter(t => t.resolutionSource === 'hybrid').length;

    // Calculate average response time (exclude outliers > 30 seconds)
    const responseTimes = tickets
      .filter(t => t.botResponseTime && t.botResponseTime < 30000)
      .map(t => t.botResponseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate average confidence score
    const confidenceScores = tickets.filter(t => t.botConfidenceScore);
    const avgConfidenceScore = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, t) => sum + t.botConfidenceScore, 0) / confidenceScores.length
      : 0;

    // Calculate success rate (bot + hybrid resolutions)
    const successRate = totalTicketsProcessed > 0 
      ? ((ticketsAutoResolved + hybridResolution) / totalTicketsProcessed) * 100 
      : 0;

    const escalationRate = totalTicketsProcessed > 0 
      ? (ticketsEscalated / totalTicketsProcessed) * 100 
      : 0;

    // Calculate customer satisfaction impact
    const feedbackTickets = tickets.filter(t => t.customerFeedbackOnBot);
    const customerSatisfactionImpact = feedbackTickets.length > 0
      ? feedbackTickets.reduce((sum, t) => sum + t.customerFeedbackOnBot, 0) / feedbackTickets.length
      : 0;

    // Calculate bot response accuracy (based on high confidence + good feedback)
    const highConfidenceTickets = tickets.filter(t => t.botConfidenceScore && t.botConfidenceScore > 0.7);
    const goodFeedbackTickets = tickets.filter(t => t.customerFeedbackOnBot && t.customerFeedbackOnBot >= 4);
    const botResponseAccuracy = tickets.length > 0
      ? (goodFeedbackTickets.length / tickets.length) * 100
      : 0;

    return {
      totalTicketsProcessed,
      ticketsAutoResolved,
      ticketsEscalated,
      ticketsWithBotResponse,
      avgResponseTime: Math.round(avgResponseTime),
      avgConfidenceScore: Math.round(avgConfidenceScore * 1000) / 1000,
      successRate: Math.round(successRate * 10) / 10,
      escalationRate: Math.round(escalationRate * 10) / 10,
      customerSatisfactionImpact: Math.round(customerSatisfactionImpact * 10) / 10,
      botResponseAccuracy: Math.round(botResponseAccuracy * 10) / 10,
      avgResolutionTime: this.calculateAvgResolutionTime(tickets) // Calculate from ticket lifecycle
    };
  }

  /**
   * Calculate action-specific metrics from action logs
   */
  private static calculateActionMetrics(actionLogs: any[]) {
    const actionTypes = ['refunds', 'coupons', 'autoReplies', 'escalations', 'autoResolves'];
    const actionBreakdown: any = {};

    actionTypes.forEach(actionType => {
      const actionTypeKey = actionType.replace('autoReplies', 'auto_reply')
                                    .replace('autoResolves', 'auto_resolve');
      
      const actionsOfType = actionLogs.filter(log => log.actionType === actionTypeKey);
      const successfulActions = actionsOfType.filter(log => log.status === 'executed');
      
      actionBreakdown[actionType] = {
        count: actionsOfType.length,
        successRate: actionsOfType.length > 0 
          ? Math.round((successfulActions.length / actionsOfType.length) * 100) 
          : 0
      };
    });

    return actionBreakdown;
  }

  /**
   * Calculate quality metrics (false positives/negatives)
   */
  private static calculateQualityMetrics(tickets: any[], actionLogs: any[]) {
    // False positives: Bot auto-resolved but customer complained or reopened
    const autoResolvedTickets = tickets.filter(t => t.resolutionSource === 'bot');
    const negativePostResolutionFeedback = autoResolvedTickets.filter(t => 
      t.customerFeedbackOnBot && t.customerFeedbackOnBot <= 2
    );
    
    const falsePositiveRate = autoResolvedTickets.length > 0
      ? (negativePostResolutionFeedback.length / autoResolvedTickets.length) * 100
      : 0;

    // False negatives: Bot escalated but could have been auto-resolved
    const escalatedTickets = tickets.filter(t => t.escalatedToHuman);
    const lowComplexityEscalations = escalatedTickets.filter(t => 
      t.botConfidenceScore && t.botConfidenceScore > 0.6 && 
      (!t.escalationReason || t.escalationReason.includes('threshold'))
    );
    
    const falseNegativeRate = escalatedTickets.length > 0
      ? (lowComplexityEscalations.length / escalatedTickets.length) * 100
      : 0;

    return {
      falsePositiveRate: Math.round(falsePositiveRate * 10) / 10,
      falseNegativeRate: Math.round(falseNegativeRate * 10) / 10
    };
  }

  /**
   * Calculate business impact metrics
   */
  private static calculateBusinessImpact(tickets: any[], actionLogs: any[]) {
    const autoResolvedTickets = tickets.filter(t => t.resolutionSource === 'bot').length;
    const hybridTickets = tickets.filter(t => t.resolutionSource === 'hybrid').length;
    
    // Time saved calculations (conservative estimates)
    const avgTimePerTicket = 25; // minutes for human agent
    const botTimePerTicket = 2; // minutes for bot processing
    const hybridTimePerTicket = 15; // minutes for bot + minimal human oversight
    
    const timeSavedFromFullAutomation = autoResolvedTickets * (avgTimePerTicket - botTimePerTicket);
    const timeSavedFromHybrid = hybridTickets * (avgTimePerTicket - hybridTimePerTicket);
    const estimatedTimesSaved = (timeSavedFromFullAutomation + timeSavedFromHybrid) / 60; // Convert to hours
    
    // Cost savings (average support agent cost)
    const hourlyRate = 25; // USD per hour
    const estimatedCostSavings = estimatedTimesSaved * hourlyRate;
    
    // Human interventions avoided
    const humanInterventionsAvoided = autoResolvedTickets;
    
    // Calculate revenue impact from successful actions
    const revenueImpact = actionLogs
      .filter(log => log.status === 'executed' && log.metadata?.businessImpact?.customerRetention)
      .length * 100; // Assume $100 value per retained customer

    return {
      estimatedTimesSaved: Math.round(estimatedTimesSaved * 10) / 10,
      estimatedCostSavings: Math.round(estimatedCostSavings * 100) / 100,
      humanInterventionsAvoided,
      revenueImpact: Math.round(revenueImpact * 100) / 100
    };
  }

  /**
   * Calculate average resolution time for tickets
   */
  private static calculateAvgResolutionTime(tickets: any[]): number {
    const resolvedTickets = tickets.filter(t => 
      t.status === 'solved' || t.status === 'closed' || t.resolutionSource === 'bot'
    );
    
    if (resolvedTickets.length === 0) return 0;
    
    // Calculate based on response time for bot-resolved tickets
    const resolutionTimes = resolvedTickets.map(t => {
      if (t.resolutionSource === 'bot' && t.botResponseTime) {
        return t.botResponseTime / (1000 * 60); // Convert to minutes
      }
      return 30; // Default assumption for human-resolved tickets
    });
    
    return Math.round(
      (resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length) * 10
    ) / 10;
  }

  /**
   * Calculate day-over-day trends
   */
  private static async calculateDayOverDayTrends(
    organizationId: string, 
    currentDate: Date, 
    currentMetrics: any
  ) {
    try {
      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);
      
      const previousMetric = await BotPerformanceMetricModel.findOne({
        organization: organizationId,
        date: previousDay
      });
      
      if (!previousMetric) {
        return {
          volumeChange: 0,
          successRateChange: 0,
          satisfactionChange: 0
        };
      }
      
      const volumeChange = previousMetric.totalTicketsProcessed > 0
        ? ((currentMetrics.totalTicketsProcessed - previousMetric.totalTicketsProcessed) / previousMetric.totalTicketsProcessed) * 100
        : 0;
        
      const successRateChange = currentMetrics.successRate - previousMetric.successRate;
      const satisfactionChange = currentMetrics.customerSatisfactionImpact - previousMetric.customerSatisfactionImpact;
      
      return {
        volumeChange: Math.round(volumeChange * 10) / 10,
        successRateChange: Math.round(successRateChange * 10) / 10,
        satisfactionChange: Math.round(satisfactionChange * 10) / 10
      };
    } catch (error) {
      console.error('Failed to calculate trends:', error);
      return {
        volumeChange: 0,
        successRateChange: 0,
        satisfactionChange: 0
      };
    }
  }

  /**
   * Create empty daily metric for days with no bot activity
   */
  private static async createEmptyDailyMetric(organizationId: string, date: Date) {
    const emptyMetric = {
      organization: organizationId,
      date,
      totalTicketsProcessed: 0,
      ticketsAutoResolved: 0,
      ticketsEscalated: 0,
      ticketsWithBotResponse: 0,
      avgResponseTime: 0,
      avgConfidenceScore: 0,
      successRate: 0,
      escalationRate: 0,
      customerSatisfactionImpact: 0,
      avgResolutionTime: 0,
      botResponseAccuracy: 0,
      estimatedCostSavings: 0,
      estimatedTimesSaved: 0,
      humanInterventionsAvoided: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      actionBreakdown: {
        refunds: { count: 0, successRate: 0 },
        coupons: { count: 0, successRate: 0 },
        autoReplies: { count: 0, successRate: 0 },
        escalations: { count: 0, successRate: 0 },
        autoResolves: { count: 0, successRate: 0 }
      },
      trends: {
        volumeChange: 0,
        successRateChange: 0,
        satisfactionChange: 0
      }
    };

    await BotPerformanceMetricModel.findOneAndUpdate(
      { organization: organizationId, date },
      { $set: emptyMetric },
      { upsert: true, new: true }
    );
  }

  /**
   * Get bot performance summary for a time period
   */
  static async getPerformanceSummary(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const metrics = await BotPerformanceMetricModel.find({
        organization: organizationId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      if (metrics.length === 0) {
        return {
          totalTickets: 0,
          avgSuccessRate: 0,
          avgResponseTime: 0,
          totalCostSavings: 0,
          avgCustomerSatisfaction: 0
        };
      }

      // Aggregate metrics
      const totalTickets = metrics.reduce((sum, m) => sum + m.totalTicketsProcessed, 0);
      const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / metrics.length;
      const totalCostSavings = metrics.reduce((sum, m) => sum + m.estimatedCostSavings, 0);
      const avgCustomerSatisfaction = metrics
        .filter(m => m.customerSatisfactionImpact > 0)
        .reduce((sum, m) => sum + m.customerSatisfactionImpact, 0) / 
        metrics.filter(m => m.customerSatisfactionImpact > 0).length || 0;

      return {
        totalTickets,
        avgSuccessRate: Math.round(avgSuccessRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        totalCostSavings: Math.round(totalCostSavings * 100) / 100,
        avgCustomerSatisfaction: Math.round(avgCustomerSatisfaction * 10) / 10,
        metricsCount: metrics.length,
        dailyMetrics: metrics
      };
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      throw error;
    }
  }
}