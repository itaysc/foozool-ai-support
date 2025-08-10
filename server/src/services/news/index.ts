import Parser from 'rss-parser';
import { OrganizationModel } from '../../schemas/organization.schema';
import { summarizeTickets } from '../call-python';
import { callLLM } from '../llm';
import { getRedisClient } from '../redis/client';
import { UserContextManager } from '../../context/userContext';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  source: string;
}

interface ProcessedNewsItem extends NewsItem {
  summary?: string;
  relevance: 'high' | 'medium' | 'low';
  impact: 'positive' | 'negative' | 'neutral';
  categories: string[];
}

interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  suggestedActions: string[];
}

export class NewsService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:description', 'mediaDescription'],
        ],
      },
    });
  }

  /**
   * Generate Google News RSS URL based on organization details
   */
  private async generateNewsRSSUrl(organization: any, userId: string | null): Promise<string> {
    // Implementation remains the same, userId is not used in RSS generation
    const baseUrl = 'https://news.google.com/rss/search?q=';
    const searchTerms = await this.generateSearchTerms(organization.details || '', organization.country || '', organization.regions || [], userId);
    const query = searchTerms.join(' OR ');
    return `${baseUrl}${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  }

  /**
   * Generate comprehensive search terms for news monitoring using LLM
   */
  private async generateSearchTerms(details: string, country: string, regions: string[], userId: string | null): Promise<string[]> {
    try {
      // Only proceed if we have a valid user ID from context
      if (!userId) {
        console.log('No valid user ID available, using fallback search terms');
        return this.getFallbackSearchTerms();
      }

      const prompt = `
        Based on the following business details, generate 15 specific search terms for news monitoring that could impact business operations:
        
        Business Details: ${details}
        Country: ${country}
        Regions: ${regions.join(', ')}
        
        Focus on terms that:
        - Could affect supply chain or operations
        - Might impact customer satisfaction
        - Could influence pricing or costs
        - May affect product availability
        - Could impact business operations and costs
        
        Return only the search terms as a JSON array of strings, no explanations:
        ["term1", "term2", "term3"]
        
        Make terms specific and actionable for business intelligence.
      `;
      
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
        return this.getFallbackSearchTerms();
      }
      
      return Array.isArray(searchTerms) ? searchTerms : this.getFallbackSearchTerms();
      
    } catch (error) {
      console.error('Error generating search terms:', error);
      return this.getFallbackSearchTerms();
    }
  }

  /**
   * Get fallback search terms when LLM is not available
   */
  private getFallbackSearchTerms(): string[] {
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

  /**
   * Fetch news from Google RSS feed
   */
  async fetchNewsFromRSS(rssUrl: string): Promise<NewsItem[]> {
    try {
      console.log(`Fetching news from RSS: ${rssUrl}`);
      
      const feed = await this.parser.parseURL(rssUrl);
      const newsItems: NewsItem[] = [];
      
      if (feed.items) {
        feed.items.forEach(item => {
          newsItems.push({
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            content: item.content || item.contentSnippet || '',
            contentSnippet: item.contentSnippet || '',
            source: item.source?.name || 'Unknown'
          });
        });
      }
      
      console.log(`Fetched ${newsItems.length} news items`);
      return newsItems;
      
    } catch (error) {
      console.error('Error fetching news from RSS:', error);
      return [];
    }
  }

  /**
   * Analyze and categorize news items
   */
  async analyzeNewsItems(newsItems: NewsItem[], organization: any, userId: string | null): Promise<ProcessedNewsItem[]> {
    try {
      const processedItems: ProcessedNewsItem[] = [];
      
      for (const item of newsItems) {
        try {
          // Only use LLM if we have a valid user ID
          if (userId) {
            const prompt = `
              Analyze this news item for business relevance and impact:
              
              Title: ${item.title}
              Content: ${item.content}
              
              Return a JSON response with:
              {
                "relevance": "high" | "medium" | "low",
                "impact": "positive" | "negative" | "neutral",
                "categories": ["category1", "category2"],
                "summary": "Brief summary of the news item"
              }
              
              Focus on business impact, customer support relevance, and operational implications.
            `;
            
            const response = await callLLM({
              userId,
              prompt,
              maxTokens: 300,
              temperature: 0.3,
              topP: 0.9,
              stop: ['\n\n']
            });
            
            const result = response.data || '';
            let analysis: any;
            
            try {
              analysis = JSON.parse(result);
            } catch (parseError) {
              console.warn('Failed to parse LLM analysis, using default values');
              analysis = this.getDefaultAnalysis(item);
            }
            
            processedItems.push({
              ...item,
              summary: analysis.summary || item.contentSnippet,
              relevance: analysis.relevance || 'medium',
              impact: analysis.impact || 'neutral',
              categories: analysis.categories || ['general']
            });
          } else {
            // No valid user ID, use default analysis
            console.log('No valid user ID available, using default analysis for news item');
            processedItems.push({
              ...item,
              summary: item.contentSnippet,
              relevance: 'medium',
              impact: 'neutral',
              categories: ['general']
            });
          }
        } catch (error) {
          console.error('Error analyzing news item:', error);
          // Add item with default values on error
          processedItems.push({
            ...item,
            summary: item.contentSnippet,
            relevance: 'medium',
            impact: 'neutral',
            categories: ['general']
          });
        }
      }
      
      return processedItems;
      
    } catch (error) {
      console.error('Error analyzing news items:', error);
      // Return items with default values on error
      return newsItems.map(item => ({
        ...item,
        summary: item.contentSnippet,
        relevance: 'medium',
        impact: 'neutral',
        categories: ['general']
      }));
    }
  }

  /**
   * Get default analysis when LLM is not available
   */
  private getDefaultAnalysis(item: NewsItem): any {
    return {
      relevance: 'medium',
      impact: 'neutral',
      categories: ['general'],
      summary: item.contentSnippet
    };
  }

  /**
   * Summarize relevant news items
   */
  async summarizeNews(newsItems: ProcessedNewsItem[]): Promise<string> {
    try {
      // Filter for high and medium relevance items
      const relevantItems = newsItems.filter(item => 
        item.relevance === 'high' || item.relevance === 'medium'
      );
      
      if (relevantItems.length === 0) {
        return 'No relevant news found for the organization.';
      }
      
      // Prepare text for summarization
      const textsToSummarize = relevantItems.map(item => 
        `${item.title}: ${item.contentSnippet}`
      );
      
      // Use the existing summarize function
      const summaries = await summarizeTickets(
        textsToSummarize.map(text => ({ subject: text, description: '' }))
      );
      
      return summaries.join('\n\n');
      
    } catch (error) {
      console.error('Error summarizing news:', error);
      return 'Failed to summarize news items.';
    }
  }

  /**
   * Generate action items based on news analysis
   */
  async generateActionItems(newsItems: ProcessedNewsItem[], organization: any, userId: string | null): Promise<ActionItem[]> {
    try {
      // Only proceed if we have a valid user ID
      if (!userId) {
        console.log('No valid user ID available, using default action items');
        return this.getDefaultActionItems();
      }

      const highImpactNews = newsItems.filter(item => item.relevance === 'high' && item.impact === 'negative');
      
      if (highImpactNews.length === 0) {
        return [];
      }
      
      const prompt = `
        Based on these high-impact news items, generate actionable recommendations:
        
        ${highImpactNews.map(item => `
          - ${item.title}: ${item.summary}
          Relevance: ${item.relevance}, Impact: ${item.impact}
        `).join('\n')}
        
        Generate 3-5 action items in JSON format:
        [
          {
            "title": "Action title",
            "description": "Detailed description",
            "priority": "high|medium|low",
            "category": "category name",
            "impact": "Expected business impact",
            "suggestedActions": ["action1", "action2"]
          }
        ]
        
        Focus on actions that:
        - Address immediate customer concerns
        - Mitigate business risks
        - Improve customer support preparedness
        - Enhance operational resilience
      `;
      
      const actionItemsResponse = await callLLM({
        userId,
        prompt,
        maxTokens: 800,
        temperature: 0.4,
        topP: 0.9,
        stop: ['\n\n']
      });
      
      const result = actionItemsResponse.data || '';
      let actionItems: ActionItem[];
      
      try {
        actionItems = JSON.parse(result);
      } catch (parseError) {
        console.warn('Failed to parse LLM action items, using default items');
        return this.getDefaultActionItems();
      }
      
      return Array.isArray(actionItems) ? actionItems : this.getDefaultActionItems();
      
    } catch (error) {
      console.error('Error generating action items:', error);
      return this.getDefaultActionItems();
    }
  }

  /**
   * Get default action items when LLM is not available
   */
  private getDefaultActionItems(): ActionItem[] {
    return [
      {
        title: "Monitor Customer Feedback",
        description: "Keep track of customer inquiries and complaints related to recent news events",
        priority: "medium",
        category: "Customer Support",
        impact: "Proactive customer service and issue prevention",
        suggestedActions: [
          "Review customer support tickets for news-related issues",
          "Prepare response templates for common concerns",
          "Monitor social media for customer sentiment"
        ]
      },
      {
        title: "Assess Supply Chain Impact",
        description: "Evaluate how recent events might affect product availability and delivery",
        priority: "high",
        category: "Operations",
        impact: "Maintain product availability and customer satisfaction",
        suggestedActions: [
          "Review inventory levels for affected products",
          "Communicate with suppliers about potential delays",
          "Update customers about delivery timelines"
        ]
      }
    ];
  }

  /**
   * Get news for a specific organization
   */
  async getNewsForOrganization(organizationId: string): Promise<{
    news: ProcessedNewsItem[];
    summary: string;
    actionItems: ActionItem[];
    rssUrl: string;
  }> {
    try {
      // Get user ID from context
      const userId = UserContextManager.getCurrentUserId();
      if (!userId) {
        // For background jobs or when no user context, use fallback approach
        console.log('User context not available, proceeding with fallback processing');
        return this.getNewsForOrganizationFallback(organizationId);
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
      const rssUrl = await this.generateNewsRSSUrl(organization, userId);
      
      // Fetch news
      const newsItems = await this.fetchNewsFromRSS(rssUrl);
      
      // Analyze news
      const processedNews = await this.analyzeNewsItems(newsItems, organization, userId);
      
      // Summarize news
      const summary = await this.summarizeNews(processedNews);
      
      // Generate action items
      const actionItems = await this.generateActionItems(processedNews, organization, userId);
      
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
  async getRawNewsForOrganization(organizationId: string): Promise<NewsItem[]> {
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
      const rssUrl = await this.generateNewsRSSUrl(organization, userId);
      
      // Fetch news
      const newsItems = await this.fetchNewsFromRSS(rssUrl);
      
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
  private async getNewsForOrganizationFallback(organizationId: string): Promise<{
    news: ProcessedNewsItem[];
    summary: string;
    actionItems: ActionItem[];
    rssUrl: string;
  }> {
    try {
      // Check Redis cache first
      const cacheKey = `news:${organizationId}`;
      const redisClient = await getRedisClient();
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('Returning cached news data for fallback processing');
        return JSON.parse(cachedData);
      }
      
      // Fetch organization details
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Generate RSS URL (use null for userId since we don't have one)
      const rssUrl = await this.generateNewsRSSUrl(organization, null);
      
      // Fetch news
      const newsItems = await this.fetchNewsFromRSS(rssUrl);
      
      // Analyze news without LLM (use default analysis)
      const processedNews = await this.analyzeNewsItems(newsItems, organization, null);
      
      // Summarize news
      const summary = await this.summarizeNews(processedNews);
      
      // Generate action items without LLM (use default items)
      const actionItems = await this.generateActionItems(processedNews, organization, null);
      
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
      console.error('Error getting news for organization with fallback processing:', error);
      throw error;
    }
  }

  /**
   * Get raw news for organization using system user (for background jobs)
   */
  private async getRawNewsForOrganizationWithSystemUser(organizationId: string): Promise<NewsItem[]> {
    const systemUserId = 'system';
    
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
      const rssUrl = await this.generateNewsRSSUrl(organization, systemUserId);
      
      // Fetch news
      const newsItems = await this.fetchNewsFromRSS(rssUrl);
      
      // Cache for 4 hours
      await redisClient.setEx(cacheKey, 14400, JSON.stringify(newsItems));
      
      return newsItems;
      
    } catch (error) {
      console.error('Error getting raw news for organization with system user:', error);
      throw error;
    }
  }
}

export const newsService = new NewsService(); 