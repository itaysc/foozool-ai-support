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
    
    // Generate all search terms using LLM
    const searchTerms = await this.generateSearchTerms(details, country, regions, userId);
    
    // Combine all terms and encode for URL
    const query = searchTerms.join(' OR ');
    const encodedQuery = encodeURIComponent(query);
    
    return `${baseUrl}${encodedQuery}&hl=en&gl=${country || 'US'}&ceid=${country || 'US'}:en`;
  }

  /**
   * Generate comprehensive search terms for news monitoring using LLM
   */
  private async generateSearchTerms(details: string, country: string, regions: string[], userId: string): Promise<string[]> {
    try {
      const prompt = `
        Generate comprehensive search terms for news monitoring that will help identify business-impacting news for customer support and operations.
        
        Organization Details: ${details}
        Country: ${country}
        Regions: ${regions.join(', ')}
        
        Generate 15-25 search terms that cover:
        
        1. **Business Operations Impact**:
           - Supply chain disruptions, logistics issues, manufacturing delays
           - Raw materials shortages, cost increases, pricing changes
           - Quality issues, product availability, delivery problems
        
        2. **Customer Support Relevance**:
           - Customer complaints, satisfaction issues, service quality
           - Delivery delays, product defects, warranty issues
           - Customer expectations, service standards, support challenges
        
        3. **Industry-Specific Factors**:
           - Industry regulations, compliance requirements, legal changes
           - Competitor issues, market disruptions, industry trends
           - Technology changes affecting the business or customers
        
        4. **Economic and Regional Factors**:
           - Inflation, currency fluctuations, economic sanctions
           - Geopolitical events, trade restrictions, regional conflicts
           - Local market conditions, regional business climate
        
        5. **Digital and Technology Impact**:
           - E-commerce trends, online shopping behavior
           - Digital transformation, automation, customer experience
           - Technology adoption, digital customer support trends
        
        Focus on terms that would help identify news that:
        - Could impact customer support operations
        - Might affect product availability or quality
        - Could influence customer expectations or complaints
        - May require proactive customer communication
        - Could impact business operations and costs
        
        Return only the search terms as a JSON array of strings, no explanations:
        ["term1", "term2", "term3"]
        
        Make terms specific and actionable for business intelligence.
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
        
        Focus on business impact factors that could affect customer support and operations:
        
        **High Relevance Criteria:**
        - Direct impact on product availability, quality, or delivery
        - Supply chain disruptions affecting the business
        - Customer complaints or satisfaction issues in the industry
        - Regulatory changes affecting operations or compliance
        - Significant price increases or cost changes
        - Technology changes affecting customer experience
        
        **Medium Relevance Criteria:**
        - Indirect impact on business operations
        - Market trends that could influence customer behavior
        - Economic factors affecting purchasing power
        - Industry-wide changes or disruptions
        - Regional events affecting business climate
        
        **Low Relevance Criteria:**
        - General news with minimal business impact
        - Unrelated industry developments
        - Events with no direct connection to operations
        
        Consider how this news might:
        - Generate customer complaints or support requests
        - Affect product delivery or availability
        - Impact customer expectations or satisfaction
        - Require proactive customer communication
        - Influence support team workload or processes
        - Affect business costs or pricing strategies
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
        generate specific action items focused on customer support and business operations.
        
        News Items:
        ${relevantItems.map(item => `- ${item.title}: ${item.contentSnippet} (Impact: ${item.impact})`).join('\n')}
        
        Provide action items in JSON format:
        [
          {
            "title": "Action item title",
            "description": "Detailed description of the action needed",
            "priority": "high|medium|low",
            "category": "customer_support|supply_chain|operations|communication|risk_management|strategy",
            "impact": "Description of potential impact on business and customers",
            "suggestedActions": ["specific action 1", "specific action 2", "specific action 3"]
          }
        ]
        
        Focus on actionable insights that can help the organization:
        
        **Customer Support Focus:**
        - Prepare support teams for potential customer complaints
        - Develop proactive communication strategies
        - Update customer-facing information and policies
        - Enhance support processes for new challenges
        - Train support staff on new issues or policies
        
        **Business Operations Focus:**
        - Mitigate supply chain and delivery risks
        - Address quality or availability issues
        - Optimize operations for new market conditions
        - Prepare for regulatory or compliance changes
        - Manage cost and pricing implications
        
        **Communication Focus:**
        - Develop customer communication strategies
        - Update website and marketing materials
        - Prepare FAQ and support documentation
        - Plan internal communication to staff
        
        **Risk Management Focus:**
        - Identify and mitigate potential risks
        - Develop contingency plans
        - Monitor and track emerging issues
        - Prepare for worst-case scenarios
        
        Prioritize actions that will:
        - Reduce customer complaints and support workload
        - Improve customer satisfaction and experience
        - Protect business operations and reputation
        - Enable proactive rather than reactive responses
        - Support long-term business sustainability
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
    rssUrl: string;
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
  private async getNewsForOrganizationWithSystemUser(organizationId: string): Promise<{
    news: ProcessedNewsItem[];
    summary: string;
    actionItems: ActionItem[];
    rssUrl: string;
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