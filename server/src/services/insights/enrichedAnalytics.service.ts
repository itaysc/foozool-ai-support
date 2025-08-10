import { TicketEnrichmentService } from '../tickets/enrichment.service';
import Config from '../../config';

export class EnrichedAnalyticsService {
  private ticketEnrichmentService: TicketEnrichmentService;

  constructor() {
    this.ticketEnrichmentService = new TicketEnrichmentService();
  }

  async generateEnrichedAnalytics(
    organizationId: string,
    options: {
      timeRange?: { start: string; end: string };
      useCache?: boolean;
      limit?: number;
    } = {}
  ) {
    const { timeRange, useCache = true, limit } = options;

    // Get enriched tickets with Zendesk data
    const enrichedTickets = await this.ticketEnrichmentService.getEnrichedTickets(
      organizationId,
      {
        timeRange,
        limit: limit || Config.ANALYTICS_TICKET_LIMIT, // Use config value if no limit specified
        enrichWithZendesk: true,
        useCache
      }
    );

    // Generate enhanced analytics using enriched data
    const enhancedAnalytics = {
      totalTickets: enrichedTickets.length,
      timeRange: timeRange || 'all_time',
      basicMetrics: {
        ticketsWithZendeskData: enrichedTickets.filter(ticket => ticket.zendeskData).length,
        ticketsWithoutZendeskData: enrichedTickets.filter(ticket => !ticket.zendeskData).length,
        averagePriority: this.calculateAveragePriority(enrichedTickets),
        topChannels: this.getTopChannels(enrichedTickets),
        satisfactionInsights: this.getSatisfactionInsights(enrichedTickets),
        responseTimeInsights: this.getResponseTimeInsights(enrichedTickets)
      },
      zendeskEnrichment: {
        priorityDistribution: this.getPriorityDistribution(enrichedTickets),
        channelBreakdown: this.getChannelBreakdown(enrichedTickets),
        tagAnalysis: this.getEnhancedTagAnalysis(enrichedTickets),
        commentAnalysis: this.getCommentAnalysis(enrichedTickets)
      },
      predictiveInsights: {
        volumePrediction: this.predictVolumeTrend(enrichedTickets, timeRange),
        priorityPrediction: this.predictPriorityTrend(enrichedTickets, timeRange),
        satisfactionPrediction: this.predictSatisfactionTrend(enrichedTickets, timeRange)
      }
    };

    return {
      analytics: enhancedAnalytics,
      metadata: {
        hasZendeskData: enrichedTickets.some(ticket => ticket.zendeskData),
        totalEnrichedTickets: enrichedTickets.length,
        enrichmentRate: enrichedTickets.length > 0 ? 
          (enrichedTickets.filter(ticket => ticket.zendeskData).length / enrichedTickets.length) * 100 : 0
      }
    };
  }

  private calculateAveragePriority(tickets: any[]): string {
    const ticketsWithPriority = tickets.filter(ticket => ticket.zendeskData?.priority);
    if (ticketsWithPriority.length === 0) return 'normal';
    
    const priorityScores = { low: 1, normal: 2, high: 3, urgent: 4 };
    const totalScore = ticketsWithPriority.reduce((sum, ticket) => {
      return sum + (priorityScores[ticket.zendeskData.priority as keyof typeof priorityScores] || 2);
    }, 0);
    
    const averageScore = totalScore / ticketsWithPriority.length;
    if (averageScore < 1.5) return 'low';
    if (averageScore < 2.5) return 'normal';
    if (averageScore < 3.5) return 'high';
    return 'urgent';
  }

  private getTopChannels(tickets: any[]): Array<{ channel: string; count: number; percentage: number }> {
    const channelCounts: Record<string, number> = {};
    const totalTickets = tickets.length;
    
    tickets.forEach(ticket => {
      if (ticket.zendeskData?.channel) {
        const channel = ticket.zendeskData.channel;
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      }
    });
    
    return Object.entries(channelCounts)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getSatisfactionInsights(tickets: any[]): any {
    const ticketsWithRating = tickets.filter(ticket => ticket.zendeskData?.satisfactionRating);
    if (ticketsWithRating.length === 0) return { message: 'No satisfaction data available' };
    
    const averageRating = ticketsWithRating.reduce((sum, ticket) => 
      sum + ticket.zendeskData.satisfactionRating, 0) / ticketsWithRating.length;
    
    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings: ticketsWithRating.length,
      ratingDistribution: this.getRatingDistribution(ticketsWithRating)
    };
  }

  private getRatingDistribution(tickets: any[]): Record<string, number> {
    const distribution: Record<string, number> = { low: 0, medium: 0, high: 0 };
    tickets.forEach(ticket => {
      const rating = ticket.zendeskData.satisfactionRating;
      if (rating <= 2) distribution.low = (distribution.low || 0) + 1;
      else if (rating <= 3) distribution.medium = (distribution.medium || 0) + 1;
      else distribution.high = (distribution.high || 0) + 1;
    });
    return distribution;
  }

  private getResponseTimeInsights(tickets: any[]): any {
    const ticketsWithResponseTime = tickets.filter(ticket => ticket.zendeskData?.firstResponseTime);
    if (ticketsWithResponseTime.length === 0) return { message: 'No response time data available' };
    
    const responseTimes = ticketsWithResponseTime.map(ticket => ticket.zendeskData.firstResponseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    return {
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      totalTicketsWithResponseTime: ticketsWithResponseTime.length,
      responseTimeDistribution: this.getResponseTimeDistribution(responseTimes)
    };
  }

  private getResponseTimeDistribution(responseTimes: number[]): Record<string, number> {
    const distribution: Record<string, number> = { fast: 0, moderate: 0, slow: 0 };
    responseTimes.forEach(time => {
      if (time <= 4) distribution.fast++;
      else if (time <= 24) distribution.moderate++;
      else distribution.slow++;
    });
    return distribution;
  }

  private getPriorityDistribution(tickets: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    tickets.forEach(ticket => {
      if (ticket.zendeskData?.priority) {
        const priority = ticket.zendeskData.priority;
        distribution[priority] = (distribution[priority] || 0) + 1;
      }
    });
    return distribution;
  }

  private getChannelBreakdown(tickets: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    tickets.forEach(ticket => {
      if (ticket.zendeskData?.channel) {
        const channel = ticket.zendeskData.channel;
        breakdown[channel] = (breakdown[channel] || 0) + 1;
      }
    });
    return breakdown;
  }

  private getEnhancedTagAnalysis(tickets: any[]): Array<{ tag: string; count: number; priority: string; channel: string }> {
    const tagAnalysis: Record<string, { count: number; priorities: string[]; channels: string[] }> = {};
    
    tickets.forEach(ticket => {
      if (ticket.zendeskData?.tags) {
        ticket.zendeskData.tags.forEach((tag: string) => {
          if (!tagAnalysis[tag]) {
            tagAnalysis[tag] = { count: 0, priorities: [], channels: [] };
          }
          tagAnalysis[tag].count++;
          if (ticket.zendeskData.priority) tagAnalysis[tag].priorities.push(ticket.zendeskData.priority);
          if (ticket.zendeskData.channel) tagAnalysis[tag].channels.push(ticket.zendeskData.channel);
        });
      }
    });
    
    return Object.entries(tagAnalysis)
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        priority: this.getMostCommon(data.priorities),
        channel: this.getMostCommon(data.channels)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getCommentAnalysis(tickets: any[]): any {
    const totalComments = tickets.reduce((sum, ticket) => 
      sum + (ticket.zendeskData?.comments?.length || 0), 0);
    
    const averageCommentsPerTicket = tickets.length > 0 ? totalComments / tickets.length : 0;
    
    return {
      totalComments,
      averageCommentsPerTicket: Math.round(averageCommentsPerTicket * 100) / 100,
      ticketsWithComments: tickets.filter(ticket => 
        ticket.zendeskData?.comments && ticket.zendeskData.comments.length > 0).length
    };
  }

  private getMostCommon(array: string[]): string {
    if (array.length === 0) return 'unknown';
    const counts: Record<string, number> = {};
    array.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0];
  }

  private predictVolumeTrend(tickets: any[], timeRange?: { start: string; end: string }): any {
    // Simple prediction based on current volume
    const currentVolume = tickets.length;
    const predictedVolume = Math.round(currentVolume * 1.1); // 10% increase assumption
    
    return {
      currentVolume,
      predictedVolume,
      confidence: 0.7,
      factors: ['Current volume trend', 'Seasonal patterns', 'Business growth']
    };
  }

  private predictPriorityTrend(tickets: any[], timeRange?: { start: string; end: string }): any {
    const highPriorityCount = tickets.filter(ticket => 
      ticket.zendeskData?.priority === 'high' || ticket.zendeskData?.priority === 'urgent').length;
    const highPriorityPercentage = tickets.length > 0 ? (highPriorityCount / tickets.length) * 100 : 0;
    
    return {
      currentHighPriorityRate: Math.round(highPriorityPercentage * 100) / 100,
      predictedHighPriorityRate: Math.round(highPriorityPercentage * 1.05 * 100) / 100,
      confidence: 0.6,
      recommendation: highPriorityPercentage > 20 ? 'Consider increasing support resources' : 'Priority levels are manageable'
    };
  }

  private predictSatisfactionTrend(tickets: any[], timeRange?: { start: string; end: string }): any {
    const ticketsWithRating = tickets.filter(ticket => ticket.zendeskData?.satisfactionRating);
    if (ticketsWithRating.length === 0) return { message: 'Insufficient data for prediction' };
    
    const currentAverage = ticketsWithRating.reduce((sum, ticket) => 
      sum + ticket.zendeskData.satisfactionRating, 0) / ticketsWithRating.length;
    
    return {
      currentAverage: Math.round(currentAverage * 100) / 100,
      predictedAverage: Math.round(currentAverage * 1.02 * 100) / 100,
      confidence: 0.5,
      trend: currentAverage > 3.5 ? 'stable' : 'improving'
    };
  }
}

export default EnrichedAnalyticsService; 