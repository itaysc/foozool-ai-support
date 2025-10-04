/**
 * Customer News Service - Handles news fetching about customer companies
 */

import { getRedisClient } from '../redis/client';
import { UserContextManager } from '../../context/userContext';
import { NewsResult } from './types';
import { RSSFetcher } from './rss-fetcher';
import { NewsAnalyzer } from './analyzer';

export class CustomerNewsService {
  private rssFetcher: RSSFetcher;
  private analyzer: NewsAnalyzer;

  constructor() {
    this.rssFetcher = new RSSFetcher();
    this.analyzer = new NewsAnalyzer();
  }

  /**
   * Generate customer-specific RSS URL (news ABOUT the customer company)
   */
  private generateCustomerNewsRSSUrl(customer: any): string {
    // Build search terms about the customer company
    const searchTerms: string[] = [];
    
    // Add company name (in quotes for exact match)
    if (customer.name) {
      searchTerms.push(`"${customer.name}"`);
      
      // Add common variations for major companies
      const companyName = customer.name.toLowerCase();
      if (companyName.includes('amazon web services') || companyName.includes('aws')) {
        searchTerms.push('"Amazon Web Services"', '"AWS"', '"Amazon"');
      } else if (companyName.includes('microsoft')) {
        searchTerms.push('"Microsoft"', '"MSFT"');
      } else if (companyName.includes('google')) {
        searchTerms.push('"Google"', '"Alphabet"', '"GOOGL"');
      } else if (companyName.includes('apple')) {
        searchTerms.push('"Apple"', '"AAPL"');
      } else if (companyName.includes('meta') || companyName.includes('facebook')) {
        searchTerms.push('"Meta"', '"Facebook"', '"META"');
      }
    }
    
    // Add ticker symbol for public companies
    if (customer.publicListing?.ticker) {
      searchTerms.push(`"${customer.publicListing.ticker}"`);
    }
    
    if (searchTerms.length === 0) {
      throw new Error('No search terms available for customer news');
    }
    
    // Combine with OR
    const query = searchTerms.join(' OR ');
    
    // Get country for localized news
    const country = customer.hq?.country || 'United States';
    const countryCode = this.rssFetcher.getCountryCode(country);
    
    console.log(`📰 Generated news search query for ${customer.name}:`, query);
    console.log(`📰 Country: ${country} (${countryCode})`);
    
    const rssUrl = this.rssFetcher.generateRSSUrl(query, countryCode);
    console.log(`📰 Generated RSS URL:`, rssUrl);
    
    return rssUrl;
  }

  /**
   * Get news specifically about a customer company (for meeting prep)
   */
  async getNewsForCustomer(customerId: string): Promise<NewsResult> {
    try {
      const userId = UserContextManager.getCurrentUserId() || 'system';
      
      // Check Redis cache
      const cacheKey = `customer_news:${customerId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached customer news data');
        return JSON.parse(cachedData);
      }
      
      // Fetch customer details
      const { CustomerModel } = await import('../../schemas');
      const customer = await CustomerModel.findById(customerId).lean();
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      console.log(`📰 Fetching news for customer: ${customer.name}`);
      
      // Generate customer-specific RSS URL
      const rssUrl = this.generateCustomerNewsRSSUrl(customer);
      
      // Try multiple RSS URLs for better coverage
      const alternativeUrls = this.rssFetcher.generateAlternativeRSSUrls(
        rssUrl.split('q=')[1]?.split('&')[0] || '', 
        customer.hq?.country || 'United States'
      );
      
      console.log(`📰 Trying ${alternativeUrls.length} RSS URLs for better coverage`);
      
      let newsItems: any[] = [];
      let successfulUrl = '';
      
      // Try each URL until we get results
      for (const url of alternativeUrls) {
        console.log(`📰 Trying RSS URL: ${url}`);
        const items = await this.rssFetcher.fetchNewsFromRSS(url);
        if (items.length > 0) {
          newsItems = items;
          successfulUrl = url;
          console.log(`📰 Successfully fetched ${items.length} items from: ${url}`);
          break;
        }
      }
      
      if (newsItems.length === 0) {
        console.log(`📰 No news found for ${customer.name} from any RSS source`);
        return {
          news: [],
          summary: `No recent news found about ${customer.name}. This could be due to limited news coverage or RSS feed issues.`,
          actionItems: [],
          rssUrl: successfulUrl || rssUrl
        };
      }
      
      // Analyze with customer context
      const processedNews = await this.analyzer.analyzeCustomerNews(newsItems, customer, userId);
      
      // Generate customer-focused summary
      const summary = await this.analyzer.summarizeCustomerNews(processedNews, customer);
      
      // Generate CS action items
      const actionItems = await this.analyzer.generateCustomerActionItems(processedNews, customer, userId);
      
      const result = {
        news: processedNews,
        summary,
        actionItems,
        rssUrl: successfulUrl || rssUrl
      };
      
      // Cache for 6 hours
      await redisClient.setEx(cacheKey, 21600, JSON.stringify(result));
      
      return result;
      
    } catch (error) {
      console.error('Error getting customer news:', error);
      // Return empty result instead of throwing
      return {
        news: [],
        summary: `Unable to fetch news at this time.`,
        actionItems: [],
        rssUrl: ''
      };
    }
  }
}

