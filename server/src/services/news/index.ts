import Parser from 'rss-parser';
import { OrganizationModel } from '../../schemas/organization.schema';
import { summarizeTickets } from '../call-python';
import { callLLM } from '../together.ai';
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
  private async generateNewsRSSUrl(organization: any, userId: string): Promise<string> {
    const { details, country, regions } = organization;
    
    // Base Google News RSS URL
    let baseUrl = 'https://news.google.com/rss/search?q=';
    
    // Build search query based on organization details
    let searchTerms: string[] = [];
    
    // Add organization details/business type
    if (details) {
      searchTerms.push(details);
    }
    
    // Add country-specific terms
    if (country) {
      searchTerms.push(country);
    }
    
    // Add region-specific terms
    if (regions && regions.length > 0) {
      regions.forEach((region: string) => {
        searchTerms.push(region);
      });
    }
    
    // Add industry-specific keywords based on details
    if (details) {
      const industryKeywords = await this.getIndustryKeywords(details, country || '', regions || [], userId);
      searchTerms.push(...industryKeywords);
    }
    
    // Add general business impact keywords
    const impactKeywords = [
      'supply chain',
      'raw materials',
      'price increase',
      'shortage',
      'geopolitical',
      'trade',
      'tariffs',
      'inflation',
      'economic impact',
      'market trends'
    ];
    
    searchTerms.push(...impactKeywords);
    
    // Combine all terms and encode for URL
    const query = searchTerms.join(' OR ');
    const encodedQuery = encodeURIComponent(query);
    
    return `${baseUrl}${encodedQuery}&hl=en&gl=${country || 'US'}&ceid=${country || 'US'}:en`;
  }

  /**
   * Get industry-specific keywords based on organization details using LLM
   */
  private async getIndustryKeywords(details: string, country: string, regions: string[], userId: string): Promise<string[]> {
    try {
      const prompt = `
        Based on the following organization details, generate 5-8 relevant industry-specific keywords for news monitoring.
        
        Organization Details: ${details}
        Country: ${country}
        Regions: ${regions.join(', ')}
        
        Generate keywords that would be relevant for:
        - Industry-specific news (supply chain, market trends, regulations)
        - Business impact factors (raw materials, pricing, competition)
        - Regional/geopolitical factors affecting the business
        - Technology trends affecting the industry
        
        Return only the keywords as a JSON array of strings, no explanations:
        ["keyword1", "keyword2", "keyword3"]
        
        Focus on specific, actionable keywords that would help identify relevant news articles.
      `;
      
      const response = await callLLM({
        userId,
        prompt,
        model: 'mistralai/Mistral-7B-Instruct-v0.1',
        maxTokens: 500,
        temperature: 0.3,
        topP: 0.9,
        stop: ['\n\n']
      });
      
      const result = response.data || '';
      let keywords: string[];
      
      try {
        keywords = JSON.parse(result);
      } catch (parseError) {
        console.warn('Failed to parse LLM keywords, using fallback keywords');
        // Fallback to basic keywords based on common terms
        const lowerDetails = details.toLowerCase();
        if (lowerDetails.includes('electronic') || lowerDetails.includes('tech')) {
          keywords = ['semiconductor', 'chip shortage', 'electronics supply'];
        } else if (lowerDetails.includes('auto') || lowerDetails.includes('car')) {
          keywords = ['automotive industry', 'car manufacturing', 'vehicle supply'];
        } else if (lowerDetails.includes('food') || lowerDetails.includes('beverage')) {
          keywords = ['food supply', 'agriculture', 'commodity prices'];
        } else if (lowerDetails.includes('retail') || lowerDetails.includes('store')) {
          keywords = ['retail industry', 'consumer spending', 'e-commerce'];
        } else {
          keywords = ['supply chain', 'market trends', 'industry news'];
        }
      }
      
      return Array.isArray(keywords) ? keywords : [];
      
    } catch (error) {
      console.error('Error generating industry keywords:', error);
      // Return basic fallback keywords
      return ['supply chain', 'market trends', 'industry news'];
    }
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
  async analyzeNewsItems(newsItems: NewsItem[], organization: any, userId: string): Promise<ProcessedNewsItem[]> {
    const processedItems: ProcessedNewsItem[] = [];
    
    for (const item of newsItems.slice(0, 20)) { // Limit to 20 items for processing
      try {
        // Create a combined text for analysis
        const combinedText = `${item.title}. ${item.contentSnippet}`;
        
        // Analyze relevance and impact using LLM
        const analysisPrompt = `
        Analyze this news item for an organization that operates in ${organization.details || 'various industries'} 
        in ${organization.country || 'multiple countries'} and regions: ${organization.regions?.join(', ') || 'global'}.
        
        News: ${combinedText}
        
        Provide analysis in JSON format:
        {
          "relevance": "high|medium|low",
          "impact": "positive|negative|neutral", 
          "categories": ["category1", "category2"],
          "reasoning": "brief explanation"
        }
        
        Consider factors like:
        - Direct impact on the organization's industry
        - Supply chain implications
        - Market trends affecting the business
        - Regulatory changes
        - Economic factors
        - Geopolitical events
        `;
        
        const analysisResponse = await callLLM({
          userId: 'system',
          prompt: analysisPrompt,
          model: 'mistralai/Mistral-7B-Instruct-v0.1',
          maxTokens: 300,
          temperature: 0.3,
          topP: 0.9,
          stop: ['\n\n']
        });
        
        const analysisResult = analysisResponse.data || '';
        let analysis;
        
        try {
          analysis = JSON.parse(analysisResult);
        } catch (parseError) {
          console.warn('Failed to parse LLM analysis, using default values');
          analysis = {
            relevance: 'medium',
            impact: 'neutral',
            categories: ['general'],
            reasoning: 'Analysis failed'
          };
        }
        
        processedItems.push({
          ...item,
          relevance: analysis.relevance || 'medium',
          impact: analysis.impact || 'neutral',
          categories: analysis.categories || ['general']
        });
        
      } catch (error) {
        console.error('Error analyzing news item:', error);
        // Add item with default analysis
        processedItems.push({
          ...item,
          relevance: 'medium',
          impact: 'neutral',
          categories: ['general']
        });
      }
    }
    
    return processedItems;
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
   * Generate action items from news analysis
   */
  async generateActionItems(newsItems: ProcessedNewsItem[], organization: any, userId: string): Promise<ActionItem[]> {
    try {
      const relevantItems = newsItems.filter(item => 
        item.relevance === 'high' || (item.relevance === 'medium' && item.impact !== 'neutral')
      );
      
      if (relevantItems.length === 0) {
        return [];
      }
      
      const actionItemsPrompt = `
        Based on the following news items for an organization that operates in ${organization.details || 'various industries'} 
        in ${organization.country || 'multiple countries'} and regions: ${organization.regions?.join(', ') || 'global'},
        generate specific action items that the organization should consider.
        
        News Items:
        ${relevantItems.map(item => `- ${item.title}: ${item.contentSnippet} (Impact: ${item.impact})`).join('\n')}
        
        Provide action items in JSON format:
        [
          {
            "title": "Action item title",
            "description": "Detailed description of the action needed",
            "priority": "high|medium|low",
            "category": "supply_chain|market_research|risk_management|strategy|operations",
            "impact": "Description of potential impact",
            "suggestedActions": ["specific action 1", "specific action 2"]
          }
        ]
        
        Focus on actionable insights that can help the organization:
        - Mitigate risks
        - Capitalize on opportunities
        - Prepare for market changes
        - Optimize operations
        - Strengthen supply chains
        `;
      
      const actionItemsResponse = await callLLM({
        userId: 'system',
        prompt: actionItemsPrompt,
        model: 'mistralai/Mistral-7B-Instruct-v0.1',
        maxTokens: 1000,
        temperature: 0.3,
        topP: 0.9,
        stop: ['\n\n']
      });
      
      const actionItemsResult = actionItemsResponse.data || '';
      let actionItems: ActionItem[];
      
      try {
        actionItems = JSON.parse(actionItemsResult);
      } catch (parseError) {
        console.warn('Failed to parse action items, returning empty array');
        return [];
      }
      
      return Array.isArray(actionItems) ? actionItems : [];
      
    } catch (error) {
      console.error('Error generating action items:', error);
      return [];
    }
  }

  /**
   * Get news for a specific organization
   */
  async getNewsForOrganization(organizationId: string): Promise<{
    news: ProcessedNewsItem[];
    summary: string;
    actionItems: ActionItem[];
  }> {
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
        actionItems
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
  private async getNewsForOrganizationWithSystemUser(organizationId: string): Promise<{
    news: ProcessedNewsItem[];
    summary: string;
    actionItems: ActionItem[];
  }> {
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
      const rssUrl = await this.generateNewsRSSUrl(organization, systemUserId);
      
      // Fetch news
      const newsItems = await this.fetchNewsFromRSS(rssUrl);
      
      // Analyze news
      const processedNews = await this.analyzeNewsItems(newsItems, organization, systemUserId);
      
      // Summarize news
      const summary = await this.summarizeNews(processedNews);
      
      // Generate action items
      const actionItems = await this.generateActionItems(processedNews, organization, systemUserId);
      
      const result = {
        news: processedNews,
        summary,
        actionItems
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
  private async getRawNewsForOrganizationWithSystemUser(organizationId: string): Promise<NewsItem[]> {
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