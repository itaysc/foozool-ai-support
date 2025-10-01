/**
 * News Service - Main orchestrator for news functionality
 */

import { NewsResult } from './types';
import { OrganizationNewsService } from './organization-news.service';
import { CustomerNewsService } from './customer-news.service';

export class NewsService {
  private organizationNewsService: OrganizationNewsService;
  private customerNewsService: CustomerNewsService;

  constructor() {
    this.organizationNewsService = new OrganizationNewsService();
    this.customerNewsService = new CustomerNewsService();
  }

  /**
   * Get news for a specific organization
   */
  async getNewsForOrganization(organizationId: string): Promise<NewsResult> {
    return this.organizationNewsService.getNewsForOrganization(organizationId);
  }

  /**
   * Get raw news without summarization (for API endpoint)
   */
  async getRawNewsForOrganization(organizationId: string): Promise<any[]> {
    return this.organizationNewsService.getRawNewsForOrganization(organizationId);
  }

  /**
   * Get news specifically about a customer company (for meeting prep)
   */
  async getNewsForCustomer(customerId: string): Promise<NewsResult> {
    return this.customerNewsService.getNewsForCustomer(customerId);
  }
}

export const newsService = new NewsService(); 

// Export types and services for direct use if needed
export * from './types';
export { OrganizationNewsService } from './organization-news.service';
export { CustomerNewsService } from './customer-news.service';
export { RSSFetcher } from './rss-fetcher';
export { NewsAnalyzer } from './analyzer';
