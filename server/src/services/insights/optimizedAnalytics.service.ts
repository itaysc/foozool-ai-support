import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { InsightModel } from '../../schemas/insight.schema';
import { UserContextManager } from '../../context/userContext';
import { getRedisClient } from '../redis/client';
import type { TicketAnalytics } from 'src/types/insights';

export interface OptimizedAnalyticsResult {
  tickets: any[];
  analytics: TicketAnalytics;
  userAgentAnalytics: any;
  insights: any;
  alerts: any[];
  metadata: {
    totalTickets: number;
    ticketsWithUserAgent: number;
    timeRange?: { start: string; end: string };
    processingTime: number;
    cached: boolean;
  };
}

export class OptimizedAnalyticsService {
  private qdrantService: QdrantService;
  private ticketCache: Map<string, { data: any[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.qdrantService = new QdrantService();
  }

  /**
   * Get all tickets for an organization with caching
   */
  private async getTicketsWithCache(timeRange?: { start: string; end: string }): Promise<any[]> {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    const cacheKey = `tickets:${organizationId}:${timeRange ? `${timeRange.start}-${timeRange.end}` : 'all'}`;
    const now = Date.now();

    // Check memory cache first
    const cached = this.ticketCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      console.log(`📦 Using memory cache for tickets: ${cached.data.length} tickets`);
      return cached.data;
    }

    // Check Redis cache
    const useCache = UserContextManager.getUseCache();
    if (useCache) {
      try {
        const redis = await getRedisClient();
        const redisCached = await redis.get(cacheKey);
        if (redisCached) {
          const parsed = JSON.parse(redisCached);
          if (parsed && Array.isArray(parsed)) {
            console.log(`📦 Using Redis cache for tickets: ${parsed.length} tickets`);
            // Update memory cache
            this.ticketCache.set(cacheKey, { data: parsed, timestamp: now });
            return parsed;
          }
        }
      } catch (error) {
        console.warn('⚠️ Redis cache error:', error);
      }
    }

    // Fetch from Qdrant
    console.log(`🔍 Fetching tickets from Qdrant for organization ${organizationId}`);
    const startTime = Date.now();

    let filter: Record<string, any> = {
      must: [
        {
          key: 'organization',
          match: { value: organizationId }
        }
      ]
    };

    if (timeRange && timeRange.start && timeRange.end) {
      filter.must.push({
        key: 'created_at',
        range: {
          gte: new Date(timeRange.start).getTime(),
          lte: new Date(timeRange.end).getTime()
        }
      });
    }

    const tickets = await this.qdrantService.client.scroll(ticketCollectionConfig.name, {
      limit: 50000,
      filter,
      with_payload: true,
      with_vector: false,
    });

    const returnedTickets = tickets.points || [];
    const fetchTime = Date.now() - startTime;
    console.log(`📊 Fetched ${returnedTickets.length} tickets in ${fetchTime}ms`);

    // Cache the results
    this.ticketCache.set(cacheKey, { data: returnedTickets, timestamp: now });
    
    if (useCache) {
      try {
        const redis = await getRedisClient();
        await redis.setEx(cacheKey, 300, JSON.stringify(returnedTickets)); // 5 minutes TTL
      } catch (error) {
        console.warn('⚠️ Failed to cache tickets in Redis:', error);
      }
    }

    return returnedTickets;
  }

  /**
   * Generate all analytics in a single optimized operation
   */
  async generateOptimizedAnalytics(timeRange?: { start: string; end: string }): Promise<OptimizedAnalyticsResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting optimized analytics generation`);

    // Get all tickets once
    const tickets = await this.getTicketsWithCache(timeRange);
    
    if (tickets.length === 0) {
      console.log(`📊 No tickets found for analytics`);
      return {
        tickets: [],
        analytics: this.getEmptyAnalytics(timeRange),
        userAgentAnalytics: this.getEmptyUserAgentAnalytics(),
        insights: { futurePredictions: [], trends: [], recommendations: [] },
        alerts: [],
        metadata: {
          totalTickets: 0,
          ticketsWithUserAgent: 0,
          timeRange,
          processingTime: Date.now() - startTime,
          cached: false
        }
      };
    }

    // Process all analytics in parallel using the same ticket data
    const [
      analytics,
      userAgentAnalytics,
      insights,
      alerts
    ] = await Promise.all([
      this.generateAnalyticsFromTickets(tickets, timeRange),
      this.generateUserAgentAnalyticsFromTickets(tickets),
      this.generateInsightsFromTickets(tickets),
      this.generateAlertsFromTickets(tickets)
    ]);

    const processingTime = Date.now() - startTime;
    const ticketsWithUserAgent = tickets.filter(ticket => ticket.payload?.user_agent).length;

    console.log(`✅ Optimized analytics completed in ${processingTime}ms`);
    console.log(`📊 Processed ${tickets.length} tickets (${ticketsWithUserAgent} with user agent data)`);

    return {
      tickets,
      analytics,
      userAgentAnalytics,
      insights,
      alerts,
      metadata: {
        totalTickets: tickets.length,
        ticketsWithUserAgent,
        timeRange,
        processingTime,
        cached: false // TODO: Implement cache detection
      }
    };
  }

  /**
   * Generate basic analytics from tickets
   */
  private async generateAnalyticsFromTickets(tickets: any[], timeRange?: { start: string; end: string }): Promise<TicketAnalytics> {
    const totalTickets = tickets.length;
    
    // Calculate sentiment distribution
    const sentimentDistribution = tickets.reduce((acc, ticket) => {
      const sentiment = ticket.payload?.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate intent distribution
    const intentDistribution = tickets.reduce((acc, ticket) => {
      const intent = ticket.payload?.intent || 'unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate tag frequency
    const tagFrequency = tickets.reduce((acc, ticket) => {
      const tags = ticket.payload?.tags || [];
      tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends (simplified)
    const volumeTrend = this.calculateVolumeTrend(tickets);
    const satisfactionTrend = this.calculateSatisfactionTrend(tickets);
    const percentageChange = this.calculatePercentageChange(tickets);

    return {
      totalTickets,
      timeRange: timeRange || { start: '', end: '' },
      sentimentDistribution,
      intentDistribution,
      tagFrequency,
      trends: {
        volumeTrend,
        satisfactionTrend,
        percentageChange
      },
      anomalies: [] // TODO: Implement anomaly detection
    };
  }

  /**
   * Generate user agent analytics from tickets
   */
  private async generateUserAgentAnalyticsFromTickets(tickets: any[]): Promise<any> {
    const ticketsWithUserAgent = tickets.filter(ticket => ticket.payload?.user_agent);
    
    if (ticketsWithUserAgent.length === 0) {
      return this.getEmptyUserAgentAnalytics(tickets.length);
    }

    // Parse user agents
    const userAgentData = ticketsWithUserAgent
      .map(ticket => {
        const userAgent = ticket.payload?.user_agent;
        if (!userAgent) return null;
        
        const parsed = this.parseUserAgent(userAgent);
        if (!parsed) return null;
        
        return {
          ticketId: ticket.id,
          userAgent,
          ...parsed
        };
      })
      .filter(Boolean);

    if (userAgentData.length === 0) {
      return this.getEmptyUserAgentAnalytics(tickets.length);
    }

    // Calculate breakdowns
    const deviceBreakdown = this.calculateDeviceBreakdown(userAgentData);
    const osBreakdown = this.calculateOSBreakdown(userAgentData);
    const browserBreakdown = this.calculateBrowserBreakdown(userAgentData);

    return {
      totalTickets: tickets.length,
      deviceBreakdown,
      osBreakdown: osBreakdown.slice(0, 5),
      browserBreakdown: browserBreakdown.slice(0, 5),
      anomalies: [],
      insights: []
    };
  }

  /**
   * Generate insights from tickets
   */
  private async generateInsightsFromTickets(tickets: any[]): Promise<any> {
    // Simplified insights generation
    return {
      futurePredictions: [],
      trends: [],
      recommendations: []
    };
  }

  /**
   * Generate alerts from tickets
   */
  private async generateAlertsFromTickets(tickets: any[]): Promise<any[]> {
    // Simplified alerts generation
    return [];
  }

  /**
   * Calculate volume trend
   */
  private calculateVolumeTrend(tickets: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    return 'stable';
  }

  /**
   * Calculate satisfaction trend
   */
  private calculateSatisfactionTrend(tickets: any[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation
    return 'stable';
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(tickets: any[]): number {
    // Simplified percentage change calculation
    return 0;
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): any {
    if (!userAgent) return null;

    try {
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
      const isDesktop = !isMobile && !isTablet;

      let os = 'Unknown';
      let browser = 'Unknown';

      if (/Windows/i.test(userAgent)) os = 'Windows';
      else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
      else if (/Android/i.test(userAgent)) os = 'Android';
      else if (/Linux/i.test(userAgent)) os = 'Linux';

      if (/Chrome/i.test(userAgent)) browser = 'Chrome';
      else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
      else if (/Edge/i.test(userAgent)) browser = 'Edge';

      const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

      return {
        browser,
        os,
        device,
        isMobile,
        isTablet,
        isDesktop
      };
    } catch (error) {
      console.error('Error parsing user agent:', userAgent, error);
      return null;
    }
  }

  /**
   * Calculate device breakdown
   */
  private calculateDeviceBreakdown(userAgentData: any[]): any {
    const deviceCounts = userAgentData.reduce((acc, data) => {
      acc[data.device] = (acc[data.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = userAgentData.length;
    
    return {
      mobile: {
        count: deviceCounts.mobile || 0,
        percentage: total > 0 ? Math.round((deviceCounts.mobile || 0) / total * 100) : 0
      },
      desktop: {
        count: deviceCounts.desktop || 0,
        percentage: total > 0 ? Math.round((deviceCounts.desktop || 0) / total * 100) : 0
      },
      tablet: {
        count: deviceCounts.tablet || 0,
        percentage: total > 0 ? Math.round((deviceCounts.tablet || 0) / total * 100) : 0
      }
    };
  }

  /**
   * Calculate OS breakdown
   */
  private calculateOSBreakdown(userAgentData: any[]): any[] {
    const osCounts = userAgentData.reduce((acc, data) => {
      acc[data.os] = (acc[data.os] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = userAgentData.length;
    
    return Object.entries(osCounts)
      .map(([os, count]) => ({
        os,
        count: count as number,
        percentage: Math.round((count as number) / total * 100)
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }

  /**
   * Calculate browser breakdown
   */
  private calculateBrowserBreakdown(userAgentData: any[]): any[] {
    const browserCounts = userAgentData.reduce((acc, data) => {
      acc[data.browser] = (acc[data.browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = userAgentData.length;
    
    return Object.entries(browserCounts)
      .map(([browser, count]) => ({
        browser,
        count: count as number,
        percentage: Math.round((count as number) / total * 100)
      }))
      .sort((a, b) => (b.count as number) - (a.count as number));
  }

  /**
   * Get empty analytics
   */
  private getEmptyAnalytics(timeRange?: { start: string; end: string }): TicketAnalytics {
    return {
      totalTickets: 0,
      timeRange: timeRange || { start: '', end: '' },
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
      intentDistribution: {},
      tagFrequency: {},
      trends: {
        volumeTrend: 'stable',
        satisfactionTrend: 'stable',
        percentageChange: 0
      },
      anomalies: []
    };
  }

  /**
   * Get empty user agent analytics
   */
  private getEmptyUserAgentAnalytics(totalTickets: number = 0): any {
    return {
      totalTickets,
      deviceBreakdown: {
        mobile: { count: 0, percentage: 0 },
        desktop: { count: 0, percentage: 0 },
        tablet: { count: 0, percentage: 0 }
      },
      osBreakdown: [],
      browserBreakdown: [],
      anomalies: [],
      insights: []
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.ticketCache.clear();
    console.log('🧹 Analytics cache cleared');
  }
} 