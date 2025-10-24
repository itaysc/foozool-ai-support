import { MeetingPrepCacheService } from './meetingPrepCache.service';

export interface CacheInvalidationEvent {
  type: 'customer_update' | 'insight_update' | 'health_score_update' | 'news_update' | 'ticket_update' | 'survey_update';
  organizationId: string;
  customerId: string;
  metadata?: {
    updatedFields?: string[];
    timestamp?: Date;
    userId?: string;
  };
}

export class CacheInvalidationService {
  private static instance: CacheInvalidationService;
  private cacheService: MeetingPrepCacheService;

  private constructor() {
    this.cacheService = MeetingPrepCacheService.getInstance();
  }

  public static getInstance(): CacheInvalidationService {
    if (!CacheInvalidationService.instance) {
      CacheInvalidationService.instance = new CacheInvalidationService();
    }
    return CacheInvalidationService.instance;
  }

  /**
   * Invalidate meeting prep cache for a specific customer
   */
  public async invalidateCustomerCache(
    organizationId: string, 
    customerId: string, 
    reason?: string
  ): Promise<void> {
    try {
      await this.cacheService.invalidateCache(organizationId, customerId);
      console.log(`🗑️ Invalidated meeting prep cache for customer ${customerId} in org ${organizationId}${reason ? ` - Reason: ${reason}` : ''}`);
    } catch (error) {
      console.error('Error invalidating customer cache:', error);
    }
  }

  /**
   * Invalidate meeting prep cache for multiple customers
   */
  public async invalidateMultipleCustomersCache(
    organizationId: string, 
    customerIds: string[], 
    reason?: string
  ): Promise<void> {
    try {
      const promises = customerIds.map(customerId => 
        this.invalidateCustomerCache(organizationId, customerId, reason)
      );
      await Promise.all(promises);
      console.log(`🗑️ Invalidated meeting prep cache for ${customerIds.length} customers in org ${organizationId}${reason ? ` - Reason: ${reason}` : ''}`);
    } catch (error) {
      console.error('Error invalidating multiple customers cache:', error);
    }
  }

  /**
   * Invalidate all meeting prep caches for an organization
   */
  public async invalidateOrganizationCache(
    organizationId: string, 
    reason?: string
  ): Promise<void> {
    try {
      await this.cacheService.invalidateOrganizationCache(organizationId);
      console.log(`🗑️ Invalidated all meeting prep caches for organization ${organizationId}${reason ? ` - Reason: ${reason}` : ''}`);
    } catch (error) {
      console.error('Error invalidating organization cache:', error);
    }
  }

  /**
   * Process cache invalidation event
   */
  public async processInvalidationEvent(event: CacheInvalidationEvent): Promise<void> {
    const { type, organizationId, customerId, metadata } = event;
    
    console.log(`📡 Processing cache invalidation event: ${type} for customer ${customerId} in org ${organizationId}`);
    
    switch (type) {
      case 'customer_update':
        await this.handleCustomerUpdate(organizationId, customerId, metadata);
        break;
      case 'insight_update':
        await this.handleInsightUpdate(organizationId, customerId, metadata);
        break;
      case 'health_score_update':
        await this.handleHealthScoreUpdate(organizationId, customerId, metadata);
        break;
      case 'news_update':
        await this.handleNewsUpdate(organizationId, customerId, metadata);
        break;
      case 'ticket_update':
        await this.handleTicketUpdate(organizationId, customerId, metadata);
        break;
      case 'survey_update':
        await this.handleSurveyUpdate(organizationId, customerId, metadata);
        break;
      default:
        console.warn(`Unknown cache invalidation event type: ${type}`);
    }
  }

  /**
   * Handle customer data updates
   */
  private async handleCustomerUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // Check if critical fields were updated that would affect meeting prep
    const criticalFields = [
      'name', 'industry', 'companySize', 'segment', 'financialMetrics',
      'startDate', 'accountManager', 'operatingRegions', 'countriesServed',
      'languages', 'publicListing', 'domains', 'competitorNames',
      'productLines', 'newsKeywords', 'excludedKeywords', 'website',
      'hq', 'usageData', 'notes'
    ];

    const updatedFields = metadata?.updatedFields || [];
    const hasCriticalUpdate = updatedFields.some(field => criticalFields.includes(field));

    if (hasCriticalUpdate) {
      await this.invalidateCustomerCache(organizationId, customerId, 'Customer data update');
    }
  }

  /**
   * Handle insight updates
   */
  private async handleInsightUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // Insights are always critical for meeting prep
    await this.invalidateCustomerCache(organizationId, customerId, 'Insight update');
  }

  /**
   * Handle health score updates
   */
  private async handleHealthScoreUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // Health score is critical for meeting prep
    await this.invalidateCustomerCache(organizationId, customerId, 'Health score update');
  }

  /**
   * Handle news updates
   */
  private async handleNewsUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // News updates affect meeting prep
    await this.invalidateCustomerCache(organizationId, customerId, 'News update');
  }

  /**
   * Handle ticket updates
   */
  private async handleTicketUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // Ticket data affects meeting prep
    await this.invalidateCustomerCache(organizationId, customerId, 'Ticket update');
  }

  /**
   * Handle survey updates
   */
  private async handleSurveyUpdate(
    organizationId: string, 
    customerId: string, 
    metadata?: CacheInvalidationEvent['metadata']
  ): Promise<void> {
    // Survey data (CSAT) affects meeting prep
    await this.invalidateCustomerCache(organizationId, customerId, 'Survey update');
  }

  /**
   * Batch invalidate caches based on multiple events
   */
  public async batchInvalidate(events: CacheInvalidationEvent[]): Promise<void> {
    try {
      const promises = events.map(event => this.processInvalidationEvent(event));
      await Promise.all(promises);
      console.log(`📡 Processed ${events.length} cache invalidation events`);
    } catch (error) {
      console.error('Error processing batch invalidation:', error);
    }
  }

  /**
   * Schedule cache cleanup (can be called by cron jobs)
   */
  public async scheduleCleanup(): Promise<void> {
    try {
      const cleanedCount = await this.cacheService.cleanupExpiredCaches();
      console.log(`🧹 Scheduled cleanup completed: ${cleanedCount} expired caches removed`);
    } catch (error) {
      console.error('Error during scheduled cleanup:', error);
    }
  }
}

// Export convenience functions for easy integration
export const invalidateCustomerMeetingPrepCache = async (
  organizationId: string, 
  customerId: string, 
  reason?: string
) => {
  const service = CacheInvalidationService.getInstance();
  return service.invalidateCustomerCache(organizationId, customerId, reason);
};

export const invalidateOrganizationMeetingPrepCache = async (
  organizationId: string, 
  reason?: string
) => {
  const service = CacheInvalidationService.getInstance();
  return service.invalidateOrganizationCache(organizationId, reason);
};

export const processCacheInvalidationEvent = async (event: CacheInvalidationEvent) => {
  const service = CacheInvalidationService.getInstance();
  return service.processInvalidationEvent(event);
};
