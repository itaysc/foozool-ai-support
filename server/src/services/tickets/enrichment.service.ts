import QdrantService from '../../qdrant/service';
import { QdrantTicketPoint, QdrantTicketPointRead, ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { fetchTicketsByExternalIds } from '../zendesk';
import { getRedisClient } from '../redis/client';
import { UserContextManager } from '../../context/userContext';
import type { ITicketSearchResult, IZendeskTicketComment } from '../../types';

export interface EnrichedTicket extends QdrantTicketPointRead {
  zendeskData?: {
    priority: string;
    satisfactionRating: number;
    comments: IZendeskTicketComment[];
    requester: { name: string; email: string };
    assignee?: { name: string; email: string };
    customFields: Record<string, any>;
    resolutionTime?: number;
    firstResponseTime?: number;
    updatedAt: string;
    tags: string[];
    channel: string;
  };
}

export class TicketEnrichmentService {
  private qdrantService: QdrantService;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    this.qdrantService = new QdrantService();
  }

  async getEnrichedTickets(
    organizationId: string,
    options: {
      timeRange?: { start: string; end: string };
      limit?: number;
      enrichWithZendesk?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<EnrichedTicket[]> {
    const {
      timeRange,
      limit = 1000,
      enrichWithZendesk = true,
      useCache = true
    } = options;

    // Check cache first if enabled
    if (useCache) {
      const cacheKey = `enriched_tickets:${organizationId}:${JSON.stringify(timeRange)}:${limit}`;
      const cachedData = await this.getCachedEnrichedData(cacheKey);
      if (cachedData) {
        console.log(`💾 Returning cached enriched tickets for organization ${organizationId}`);
        return cachedData;
      }
    }

    try {
      // Get tickets from Qdrant
      const tickets = await this.getTicketsFromQdrant(organizationId, timeRange, limit);
      
      if (tickets.length === 0) {
        console.log(`📊 No tickets found in Qdrant for organization ${organizationId}`);
        return [];
      }

      let enrichedTickets: EnrichedTicket[] = tickets;

      // Enrich with Zendesk data if requested
      if (enrichWithZendesk) {
        enrichedTickets = await this.enrichTicketsWithZendesk(tickets);
      }

      // Cache the enriched data if caching is enabled
      if (useCache) {
        const cacheKey = `enriched_tickets:${organizationId}:${JSON.stringify(timeRange)}:${limit}`;
        await this.cacheEnrichedData(cacheKey, enrichedTickets);
      }

      return enrichedTickets;
    } catch (error) {
      console.error('❌ Error getting enriched tickets:', error);
      throw error;
    }
  }

  /**
   * Get tickets from Qdrant
   */
  private async getTicketsFromQdrant(
    organizationId: string,
    timeRange?: { start: string; end: string },
    limit: number = 1000
  ): Promise<QdrantTicketPointRead[]> {
    try {
      let filter: Record<string, any> = {
        must: [
          {
            key: 'organization',
            match: { value: organizationId }
          }
        ]
      };

      // Add time filter if provided
      if (timeRange && timeRange.start && timeRange.end) {
        const startDate = new Date(timeRange.start);
        const endDate = new Date(timeRange.end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('❌ Invalid time range format:', timeRange);
          return [];
        }
        
        filter.must.push({
          key: 'created_at',
          range: {
            gte: startDate.getTime(),
            lte: endDate.getTime()
          }
        });
      }

      const result = await this.qdrantService.client.scroll(ticketCollectionConfig.name, {
        limit,
        filter,
        with_payload: true,
        with_vector: false,
      });

      const tickets = result.points || [];
      console.log(`📊 Retrieved ${tickets.length} tickets from Qdrant for organization ${organizationId}`);
      return tickets as QdrantTicketPointRead[];
    } catch (error) {
      console.error('❌ Error getting tickets from Qdrant:', error);
      return [];
    }
  }

  /**
   * Enrich Qdrant tickets with Zendesk data
   */
  private async enrichTicketsWithZendesk(tickets: QdrantTicketPointRead[]): Promise<EnrichedTicket[]> {
    if (tickets.length === 0) return [];

    try {
      // Extract external IDs from Qdrant tickets
      const externalIds = tickets.map(ticket => ticket.payload.ticket_id);
      
      // Fetch Zendesk data in batches (Zendesk API has limits)
      const batchSize = 100;
      const enrichedTickets: EnrichedTicket[] = [];
      
      for (let i = 0; i < externalIds.length; i += batchSize) {
        const batch = externalIds.slice(i, i + batchSize);
        const zendeskTickets = await fetchTicketsByExternalIds(batch, { fetchComments: true });
        
        // Map Zendesk data to Qdrant tickets
        for (const qdrantTicket of tickets.slice(i, i + batchSize)) {
          const zendeskTicket = zendeskTickets.find(zt => zt?.external_id === qdrantTicket.payload.ticket_id);
          
          if (zendeskTicket) {
            enrichedTickets.push({
              ...qdrantTicket,
              zendeskData: {
                priority: zendeskTicket.priority || 'normal',
                satisfactionRating: 0, // Zendesk doesn't provide this in search results
                comments: zendeskTicket.comments || [],
                requester: {
                  name: zendeskTicket.requester?.name || 'Unknown',
                  email: 'Unknown' // Not available in search results
                },
                assignee: undefined, // Not available in search results
                customFields: this.parseCustomFields(zendeskTicket.custom_fields || []),
                resolutionTime: undefined, // Would need additional API calls
                firstResponseTime: undefined, // Would need additional API calls
                updatedAt: zendeskTicket.updated_at || '',
                tags: zendeskTicket.tags || [],
                channel: zendeskTicket.via?.channel || 'unknown'
              }
            });
          } else {
            // Ticket not found in Zendesk, keep Qdrant data only
            enrichedTickets.push({
              ...qdrantTicket,
              zendeskData: undefined
            });
          }
        }
        
        // Add small delay to respect API rate limits
        if (i + batchSize < externalIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`🔍 Enriched ${enrichedTickets.length} tickets with Zendesk data`);
      return enrichedTickets;
    } catch (error) {
      console.error('❌ Error enriching tickets with Zendesk data:', error);
      // Return Qdrant tickets without enrichment if Zendesk fails
      return tickets.map(ticket => ({ ...ticket, zendeskData: undefined }));
    }
  }

  /**
   * Parse custom fields from Zendesk response
   */
  private parseCustomFields(customFields: Array<{ id: number; value: string }>): Record<string, any> {
    const parsed: Record<string, any> = {};
    for (const field of customFields) {
      parsed[`field_${field.id}`] = field.value;
    }
    return parsed;
  }

  /**
   * Cache enriched ticket data
   */
  private async cacheEnrichedData(cacheKey: string, data: EnrichedTicket[]): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(data));
      console.log(`💾 Cached enriched tickets data for key: ${cacheKey} (TTL: ${this.CACHE_TTL}s)`);
    } catch (error) {
      console.warn('⚠️ Failed to cache enriched tickets data:', error);
    }
  }

  /**
   * Get cached enriched ticket data
   */
  private async getCachedEnrichedData(cacheKey: string): Promise<EnrichedTicket[] | null> {
    try {
      const redis = await getRedisClient();
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`💾 Retrieved cached enriched tickets data for key: ${cacheKey}`);
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Failed to get cached enriched tickets data:', error);
      return null;
    }
  }

  /**
   * Get detailed information for a specific ticket
   */
  async getTicketDetails(ticketId: string, organizationId: string): Promise<EnrichedTicket | null> {
    try {
      const ticket = await this.getTicketFromQdrant(ticketId, organizationId);
      if (!ticket) return null;

      // Enrich with Zendesk data
      const enrichedTickets = await this.enrichTicketsWithZendesk([ticket]);
      return enrichedTickets[0] || null;
    } catch (error) {
      console.error('❌ Error getting ticket details:', error);
      return null;
    }
  }

  /**
   * Get a single ticket from Qdrant
   */
  private async getTicketFromQdrant(ticketId: string, organizationId: string): Promise<QdrantTicketPointRead | null> {
    try {
      const result = await this.qdrantService.client.scroll(ticketCollectionConfig.name, {
        limit: 1,
        filter: {
          must: [
            {
              key: 'organization',
              match: { value: organizationId }
            },
            {
              key: 'ticket_id',
              match: { value: ticketId }
            }
          ]
        },
        with_payload: true,
        with_vector: false,
      });

      return result.points?.[0] as QdrantTicketPointRead || null;
    } catch (error) {
      console.error('❌ Error getting ticket from Qdrant:', error);
      return null;
    }
  }

  /**
   * Clear cache for an organization
   */
  async clearCache(organizationId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `enriched_tickets:${organizationId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        // Delete keys one by one to avoid spread operator issues
        for (const key of keys) {
          await redis.del(key);
        }
        console.log(`🗑️ Cleared ${keys.length} cache entries for organization ${organizationId}`);
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

export default TicketEnrichmentService; 