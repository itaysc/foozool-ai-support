/**
 * Organization News Service - Handles news fetching for organizations
 */

import { OrganizationModel } from '../../schemas/organization.schema';
import { callLLM } from '../llm';
import { getRedisClient } from '../redis/client';
import { UserContextManager } from '../../context/userContext';
import { NewsResult } from './types';
import { RSSFetcher } from './rss-fetcher';
import { NewsAnalyzer } from './analyzer';
import { generateSearchTermsPrompt } from './prompts';

export class OrganizationNewsService {
  private rssFetcher: RSSFetcher;
  private analyzer: NewsAnalyzer;

  constructor() {
    this.rssFetcher = new RSSFetcher();
    this.analyzer = new NewsAnalyzer();
  }

  /**
   * Generate Google News RSS URL based on organization details
   */
  private async generateOrganizationNewsRSSUrl(organization: any, userId: string): Promise<string> {
    const { details, country, regions } = organization;
    
    // Generate all search terms using LLM
    const searchTerms = await this.generateSearchTerms(details, country, regions, userId);
    
    // Combine all terms and encode for URL
    const query = searchTerms.join(' OR ');
    const countryCode = this.rssFetcher.getCountryCode(country || 'US');
    
    return this.rssFetcher.generateRSSUrl(query, countryCode);
  }

  /**
   * Generate comprehensive search terms for news monitoring using LLM
   */
  private async generateSearchTerms(details: string, country: string, regions: string[], userId: string): Promise<string[]> {
    try {
      const prompt = generateSearchTermsPrompt(details, country, regions);
      
      const response = await callLLM({
        userId,
        prompt,
        maxTokens: 500,
        temperature: 0.3,
        topP: 0.9,
        stop: ['\n\n']
      });
      
      const result = response.data || '';
      let searchTerms: string[];
      
      try {
        searchTerms = JSON.parse(result);
      } catch (parseError) {
        console.warn('Failed to parse LLM search terms, using fallback terms');
        // Fallback to comprehensive business-impacting terms
        searchTerms = [
          'supply chain disruption',
          'customer complaints',
          'delivery delays',
          'price increase',
          'quality issues',
          'product availability',
          'customer satisfaction',
          'logistics problems',
          'manufacturing delays',
          'service quality',
          'inflation impact',
          'raw materials shortage',
          'customer expectations',
          'support challenges',
          'business operations'
        ];
      }
      
      return Array.isArray(searchTerms) ? searchTerms : [];
      
    } catch (error) {
      console.error('Error generating search terms:', error);
      // Return comprehensive fallback terms focused on business impact
      return [
        'supply chain disruption',
        'customer complaints',
        'delivery delays',
        'price increase',
        'quality issues',
        'product availability',
        'customer satisfaction',
        'logistics problems',
        'manufacturing delays',
        'service quality',
        'inflation impact',
        'raw materials shortage',
        'customer expectations',
        'support challenges',
        'business operations'
      ];
    }
  }

  /**
   * Get news for a specific organization
   */
  async getNewsForOrganization(organizationId: string): Promise<NewsResult> {
    try {
      // Get user ID from context
      const userId = UserContextManager.getCurrentUserId();
      if (!userId) {
        // For background jobs, use system user ID
        console.log('User context not available, using system user for background processing');
        return this.getNewsForOrganizationWithSystemUser(organizationId);
      }
      
      // Check Redis cache first
      const cacheKey = `news:${organizationId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached news data');
        return JSON.parse(cachedData);
      }
      
      // Fetch organization details
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Generate RSS URL
      const rssUrl = await this.generateOrganizationNewsRSSUrl(organization, userId);
      
      // Fetch news
      const newsItems = await this.rssFetcher.fetchNewsFromRSS(rssUrl);
      
      // Analyze news
      const processedNews = await this.analyzer.analyzeOrganizationNews(newsItems, organization, userId);
      
      // Summarize news
      const summary = await this.analyzer.summarizeNews(processedNews);
      
      // Generate action items
      const actionItems = await this.analyzer.generateOrganizationActionItems(processedNews, organization, userId);
      
      const result = {
        news: processedNews,
        summary,
        actionItems,
        rssUrl
      };
      
      // Cache for 4 hours
      await redisClient.setEx(cacheKey, 14400, JSON.stringify(result));
      
      return result;
      
    } catch (error) {
      console.error('Error getting news for organization:', error);
      throw error;
    }
  }

  /**
   * Get raw news without summarization (for API endpoint)
   */
  async getRawNewsForOrganization(organizationId: string): Promise<any[]> {
    try {
      // Get user ID from context
      const userId = UserContextManager.getCurrentUserId();
      if (!userId) {
        // For background jobs, use system user ID
        console.log('User context not available, using system user for background processing');
        return this.getRawNewsForOrganizationWithSystemUser(organizationId);
      }
      
      // Check Redis cache first
      const cacheKey = `raw_news:${organizationId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached raw news data');
        return JSON.parse(cachedData);
      }
      
      // Fetch organization details
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Generate RSS URL
      const rssUrl = await this.generateOrganizationNewsRSSUrl(organization, userId);
      
      // Fetch news
      const newsItems = await this.rssFetcher.fetchNewsFromRSS(rssUrl);
      
      // Cache for 4 hours
      await redisClient.setEx(cacheKey, 14400, JSON.stringify(newsItems));
      
      return newsItems;
      
    } catch (error) {
      console.error('Error getting raw news for organization:', error);
      throw error;
    }
  }

  /**
   * Get news for organization using system user (for background jobs)
   */
  private async getNewsForOrganizationWithSystemUser(organizationId: string): Promise<NewsResult> {
    const systemUserId = 'system-news-monitoring';
    
    try {
      // Check Redis cache first
      const cacheKey = `news:${organizationId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached news data for system user');
        return JSON.parse(cachedData);
      }
      
      // Fetch organization details
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Generate RSS URL
      const rssUrl = await this.generateOrganizationNewsRSSUrl(organization, systemUserId);
      
      // Fetch news
      const newsItems = await this.rssFetcher.fetchNewsFromRSS(rssUrl);
      
      // Analyze news
      const processedNews = await this.analyzer.analyzeOrganizationNews(newsItems, organization, systemUserId);
      
      // Summarize news
      const summary = await this.analyzer.summarizeNews(processedNews);
      
      // Generate action items
      const actionItems = await this.analyzer.generateOrganizationActionItems(processedNews, organization, systemUserId);
      
      const result = {
        news: processedNews,
        summary,
        actionItems,
        rssUrl
      };
      
      // Cache for 4 hours
      await redisClient.setEx(cacheKey, 14400, JSON.stringify(result));
      
      return result;
      
    } catch (error) {
      console.error('Error getting news for organization with system user:', error);
      throw error;
    }
  }

  /**
   * Get raw news for organization using system user (for background jobs)
   */
  private async getRawNewsForOrganizationWithSystemUser(organizationId: string): Promise<any[]> {
    const systemUserId = 'system-news-monitoring';
    
    try {
      // Check Redis cache first
      const cacheKey = `raw_news:${organizationId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached raw news data for system user');
        return JSON.parse(cachedData);
      }
      
      // Fetch organization details
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Generate RSS URL
      const rssUrl = await this.generateOrganizationNewsRSSUrl(organization, systemUserId);
      
      // Fetch news
      const newsItems = await this.rssFetcher.fetchNewsFromRSS(rssUrl);
      
      // Cache for 4 hours
      await redisClient.setEx(cacheKey, 14400, JSON.stringify(newsItems));
      
      return newsItems;
      
    } catch (error) {
      console.error('Error getting raw news for organization with system user:', error);
      throw error;
    }
  }
}

