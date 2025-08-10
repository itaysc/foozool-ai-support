import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { UserContextManager } from '../../context/userContext';

export interface UserAgentInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: 'mobile' | 'desktop' | 'tablet';
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface UserAgentData extends UserAgentInfo {
  ticketId: string | number;
  userAgent: string;
}

export interface UserAgentAnalytics {
  totalTickets: number; // Total tickets in the system (including those without user agent data)
  deviceBreakdown: {
    mobile: { count: number; percentage: number };
    desktop: { count: number; percentage: number };
    tablet: { count: number; percentage: number };
  };
  osBreakdown: Array<{
    os: string;
    count: number;
    percentage: number;
    versions: Array<{ version: string; count: number; percentage: number }>;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
    percentage: number;
    versions: Array<{ version: string; count: number; percentage: number }>;
  }>;
  topUserAgents: Array<{
    userAgent: string;
    count: number;
    percentage: number;
    device: string;
    os: string;
    browser: string;
  }>;
  anomalies: Array<{
    type: 'os_spike' | 'browser_spike' | 'device_spike' | 'version_issue';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: {
      metric: string;
      value: number;
      expectedRange: [number, number];
      affectedTickets: number;
    };
  }>;
  insights: Array<{
    type: 'trend' | 'pattern' | 'recommendation';
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
    data: Record<string, any>;
  }>;
}

export class UserAgentAnalyticsService {
  private qdrantService: QdrantService;

  constructor() {
    this.qdrantService = new QdrantService();
  }

  /**
   * Parse user agent string to extract device, OS, and browser information
   */
  private parseUserAgent(userAgent: string): UserAgentInfo | null {
    if (!userAgent) return null;

    try {
      // Mobile detection
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
      const isDesktop = !isMobile && !isTablet;

      // OS detection
      let os = 'Unknown';
      let osVersion = 'Unknown';
      
      if (/Windows/i.test(userAgent)) {
        os = 'Windows';
        const match = userAgent.match(/Windows NT (\d+\.\d+)/);
        if (match) {
          const version = parseFloat(match[1]);
          if (version === 10.0) osVersion = '10';
          else if (version === 6.3) osVersion = '8.1';
          else if (version === 6.2) osVersion = '8';
          else if (version === 6.1) osVersion = '7';
          else osVersion = match[1];
        }
      } else if (/Mac OS X/i.test(userAgent)) {
        os = 'macOS';
        const match = userAgent.match(/Mac OS X (\d+_\d+)/);
        if (match) {
          osVersion = match[1].replace('_', '.');
        }
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        os = 'iOS';
        const match = userAgent.match(/OS (\d+_\d+)/);
        if (match) {
          osVersion = match[1].replace('_', '.');
        }
      } else if (/Android/i.test(userAgent)) {
        os = 'Android';
        const match = userAgent.match(/Android (\d+\.\d+)/);
        if (match) {
          osVersion = match[1];
        }
      } else if (/Linux/i.test(userAgent)) {
        os = 'Linux';
        osVersion = 'Unknown';
      }

      // Browser detection
      let browser = 'Unknown';
      let browserVersion = 'Unknown';
      
      if (/Chrome/i.test(userAgent)) {
        browser = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
      } else if (/Firefox/i.test(userAgent)) {
        browser = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
      } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        browser = 'Safari';
        const match = userAgent.match(/Version\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
      } else if (/Edge/i.test(userAgent)) {
        browser = 'Edge';
        const match = userAgent.match(/Edge\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
      }

      const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
      const platform = `${os} ${osVersion}`;

      return {
        browser,
        browserVersion,
        os,
        osVersion,
        device,
        platform,
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
   * Get all tickets for the organization (with optional user agent filtering)
   */
  private async getTickets(timeRange?: { start: string; end: string }, requireUserAgent: boolean = false): Promise<any[]> {
    try {
      const organizationId = UserContextManager.getCurrentOrganizationId();
      if (!organizationId) {
        throw new Error('User context not available');
      }

      console.log(`🔍 Debug: Fetching tickets for organization ${organizationId}`);
      console.log(`🔍 Debug: Time range:`, timeRange);
      console.log(`🔍 Debug: Require user agent:`, requireUserAgent);

      // Build filter based on requirements
      let filter: Record<string, any> = {
        must: [
          {
            key: 'organization',
            match: { value: organizationId }
          }
        ]
      };

      // Add user agent requirement if needed
      if (requireUserAgent) {
        filter.must.push({
          exists: { key: 'user_agent' }
        });
      }

      // Add time filter if provided
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
      console.log(`📊 Retrieved ${returnedTickets.length} tickets for organization ${organizationId}`);
      
      if (requireUserAgent) {
        const ticketsWithUserAgent = returnedTickets.filter(ticket => ticket.payload?.user_agent);
        console.log(`📊 Tickets with user agent data: ${ticketsWithUserAgent.length}`);
        return ticketsWithUserAgent;
      }
      
      return returnedTickets;
    } catch (error) {
      console.error('❌ Error getting tickets:', error);
      return [];
    }
  }

  /**
   * Get all tickets with user agent data for the organization
   */
  private async getTicketsWithUserAgent(timeRange?: { start: string; end: string }): Promise<any[]> {
    return this.getTickets(timeRange, true);
  }

  /**
   * Generate comprehensive user agent analytics
   */
  async generateUserAgentAnalytics(timeRange?: { start: string; end: string }): Promise<UserAgentAnalytics> {
    // Get all tickets first
    const allTickets = await this.getTickets(timeRange, false);
    
    if (allTickets.length === 0) {
      return this.getEmptyAnalytics(0);
    }

    // Filter tickets that have user agent data
    const ticketsWithUserAgent = allTickets.filter(ticket => ticket.payload?.user_agent);
    
    if (ticketsWithUserAgent.length === 0) {
      console.log(`📊 No tickets with user agent data found. Total tickets: ${allTickets.length}`);
      return this.getEmptyAnalytics(allTickets.length);
    }

    console.log(`📊 Processing user agent analytics: ${ticketsWithUserAgent.length}/${allTickets.length} tickets have user agent data`);

    // Parse user agents for tickets that have them
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
      console.log(`📊 No valid user agent data found after parsing`);
      return this.getEmptyAnalytics(allTickets.length);
    }

    // Calculate device breakdown
    const deviceBreakdown = this.calculateDeviceBreakdown(userAgentData);
    
    // Calculate OS breakdown
    const osBreakdown = this.calculateOSBreakdown(userAgentData);
    
    // Calculate browser breakdown
    const browserBreakdown = this.calculateBrowserBreakdown(userAgentData);
    
    // Get top user agents
    const topUserAgents = this.getTopUserAgents(userAgentData);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(userAgentData, allTickets.length);
    
    // Generate insights
    const insights = this.generateInsights(userAgentData, deviceBreakdown, osBreakdown, browserBreakdown);

    return {
      totalTickets: allTickets.length, // Total tickets in the system
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      topUserAgents,
      anomalies,
      insights
    };
  }

  /**
   * Calculate device breakdown
   */
  private calculateDeviceBreakdown(userAgentData: any[]): UserAgentAnalytics['deviceBreakdown'] {
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
  private calculateOSBreakdown(userAgentData: any[]): UserAgentAnalytics['osBreakdown'] {
    const osCounts = userAgentData.reduce((acc, data) => {
      if (!acc[data.os]) {
        acc[data.os] = { count: 0, versions: {} as Record<string, number> };
      }
      acc[data.os].count++;
      
      if (!acc[data.os].versions[data.osVersion]) {
        acc[data.os].versions[data.osVersion] = 0;
      }
      acc[data.os].versions[data.osVersion]++;
      
      return acc;
    }, {} as Record<string, { count: number; versions: Record<string, number> }>);

    const total = userAgentData.length;
    
    return Object.entries(osCounts)
      .map(([os, data]) => {
        const typedData = data as { count: number; versions: Record<string, number> };
        return {
          os,
          count: typedData.count,
          percentage: Math.round(typedData.count / total * 100),
          versions: Object.entries(typedData.versions)
            .map(([version, count]) => ({
              version,
              count: count as number,
              percentage: Math.round((count as number) / total * 100)
            }))
            .sort((a, b) => (b.count as number) - (a.count as number))
        };
      })
      .sort((a, b) => (b as any).count - (a as any).count);
  }

  /**
   * Calculate browser breakdown
   */
  private calculateBrowserBreakdown(userAgentData: any[]): UserAgentAnalytics['browserBreakdown'] {
    const browserCounts = userAgentData.reduce((acc, data) => {
      if (!acc[data.browser]) {
        acc[data.browser] = { count: 0, versions: {} as Record<string, number> };
      }
      acc[data.browser].count++;
      
      if (!acc[data.browser].versions[data.browserVersion]) {
        acc[data.browser].versions[data.browserVersion] = 0;
      }
      acc[data.browser].versions[data.browserVersion]++;
      
      return acc;
    }, {} as Record<string, { count: number; versions: Record<string, number> }>);

    const total = userAgentData.length;
    
    return Object.entries(browserCounts)
      .map(([browser, data]) => {
        const typedData = data as { count: number; versions: Record<string, number> };
        return {
          browser,
          count: typedData.count,
          percentage: Math.round(typedData.count / total * 100),
          versions: Object.entries(typedData.versions)
            .map(([version, count]) => ({
              version,
              count: count as number,
              percentage: Math.round((count as number) / total * 100)
            }))
            .sort((a, b) => (b.count as number) - (a.count as number))
        };
      })
      .sort((a, b) => (b as any).count - (a as any).count);
  }

  /**
   * Get top user agents
   */
  private getTopUserAgents(userAgentData: any[]): UserAgentAnalytics['topUserAgents'] {
    const userAgentCounts = userAgentData.reduce((acc, data) => {
      acc[data.userAgent] = (acc[data.userAgent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = userAgentData.length;
    
    return Object.entries(userAgentCounts)
      .map(([userAgent, count]) => {
        const data = userAgentData.find(d => d.userAgent === userAgent);
        return {
          userAgent,
          count: count as number,
          percentage: Math.round((count as number) / total * 100),
          device: data?.device || 'unknown',
          os: data?.os || 'unknown',
          browser: data?.browser || 'unknown'
        };
      })
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10);
  }

  /**
   * Detect anomalies in user agent patterns
   */
  private detectAnomalies(userAgentData: any[], totalTickets: number): UserAgentAnalytics['anomalies'] {
    const anomalies: UserAgentAnalytics['anomalies'] = [];
    
    // Calculate expected ranges (simple heuristic)
    const expectedDevicePercentage = 100 / 3; // 33.33% each for mobile, desktop, tablet
    const expectedOSPercentage = 100 / 5; // 20% each for top 5 OS
    const expectedBrowserPercentage = 100 / 4; // 25% each for top 4 browsers

    // Device anomalies
    const deviceBreakdown = this.calculateDeviceBreakdown(userAgentData);
    Object.entries(deviceBreakdown).forEach(([device, data]) => {
      if (data.percentage > 70) {
        anomalies.push({
          type: 'device_spike',
          title: `High ${device} usage detected`,
          description: `${data.percentage}% of tickets are from ${device} devices, which is significantly higher than expected`,
          severity: data.percentage > 80 ? 'high' : 'medium',
          data: {
            metric: `${device} percentage`,
            value: data.percentage,
            expectedRange: [20, 50],
            affectedTickets: data.count
          }
        });
      }
    });

    // OS anomalies
    const osBreakdown = this.calculateOSBreakdown(userAgentData);
    osBreakdown.forEach(os => {
      if (os.percentage > 50) {
        anomalies.push({
          type: 'os_spike',
          title: `High ${os.os} usage detected`,
          description: `${os.percentage}% of tickets are from ${os.os} users, which may indicate platform-specific issues`,
          severity: os.percentage > 70 ? 'high' : 'medium',
          data: {
            metric: `${os.os} percentage`,
            value: os.percentage,
            expectedRange: [10, 40],
            affectedTickets: os.count
          }
        });
      }
    });

    // Browser anomalies
    const browserBreakdown = this.calculateBrowserBreakdown(userAgentData);
    browserBreakdown.forEach(browser => {
      if (browser.percentage > 60) {
        anomalies.push({
          type: 'browser_spike',
          title: `High ${browser.browser} usage detected`,
          description: `${browser.percentage}% of tickets are from ${browser.browser} users, which may indicate browser-specific issues`,
          severity: browser.percentage > 80 ? 'high' : 'medium',
          data: {
            metric: `${browser.browser} percentage`,
            value: browser.percentage,
            expectedRange: [15, 45],
            affectedTickets: browser.count
          }
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate insights from user agent data
   */
  private generateInsights(
    userAgentData: any[],
    deviceBreakdown: UserAgentAnalytics['deviceBreakdown'],
    osBreakdown: UserAgentAnalytics['osBreakdown'],
    browserBreakdown: UserAgentAnalytics['browserBreakdown']
  ): UserAgentAnalytics['insights'] {
    const insights: UserAgentAnalytics['insights'] = [];

    // Device trend insights
    if (deviceBreakdown.mobile.percentage > 60) {
      insights.push({
        type: 'trend',
        title: 'Mobile-first user base',
        description: 'Majority of users are accessing from mobile devices, suggesting mobile optimization should be a priority',
        impact: 'neutral',
        confidence: 0.8,
        data: { mobilePercentage: deviceBreakdown.mobile.percentage }
      });
    }

    if (deviceBreakdown.desktop.percentage > 60) {
      insights.push({
        type: 'trend',
        title: 'Desktop-focused user base',
        description: 'Most users are on desktop, indicating complex workflows or feature-rich applications',
        impact: 'positive',
        confidence: 0.7,
        data: { desktopPercentage: deviceBreakdown.desktop.percentage }
      });
    }

    // OS insights
    const topOS = osBreakdown[0];
    if (topOS && topOS.percentage > 40) {
      insights.push({
        type: 'pattern',
        title: `${topOS.os} dominance`,
        description: `${topOS.os} is the primary platform, consider prioritizing ${topOS.os}-specific features and testing`,
        impact: 'neutral',
        confidence: 0.9,
        data: { os: topOS.os, percentage: topOS.percentage }
      });
    }

    // Browser insights
    const topBrowser = browserBreakdown[0];
    if (topBrowser && topBrowser.percentage > 50) {
      insights.push({
        type: 'pattern',
        title: `${topBrowser.browser} preference`,
        description: `${topBrowser.browser} is the most popular browser, ensure optimal compatibility and performance`,
        impact: 'neutral',
        confidence: 0.8,
        data: { browser: topBrowser.browser, percentage: topBrowser.percentage }
      });
    }

    // Cross-platform insights
    if (deviceBreakdown.mobile.percentage > 30 && deviceBreakdown.desktop.percentage > 30) {
      insights.push({
        type: 'recommendation',
        title: 'Cross-platform usage detected',
        description: 'Significant usage across mobile and desktop platforms, ensure responsive design and consistent experience',
        impact: 'positive',
        confidence: 0.7,
        data: { 
          mobilePercentage: deviceBreakdown.mobile.percentage,
          desktopPercentage: deviceBreakdown.desktop.percentage
        }
      });
    }

    return insights;
  }

  /**
   * Get empty analytics structure
   */
  private getEmptyAnalytics(totalTickets?: number): UserAgentAnalytics {
    return {
      totalTickets: totalTickets || 0,
      deviceBreakdown: {
        mobile: { count: 0, percentage: 0 },
        desktop: { count: 0, percentage: 0 },
        tablet: { count: 0, percentage: 0 }
      },
      osBreakdown: [],
      browserBreakdown: [],
      topUserAgents: [],
      anomalies: [],
      insights: []
    };
  }
} 