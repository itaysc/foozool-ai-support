import apiService from './api-service';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  source: string;
}

export interface ProcessedNewsItem extends NewsItem {
  summary?: string;
  relevance: 'high' | 'medium' | 'low';
  impact: 'positive' | 'negative' | 'neutral';
  categories: string[];
}

export interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  suggestedActions: string[];
}

export interface NewsData {
  news: ProcessedNewsItem[];
  summary: string;
  actionItems: ActionItem[];
  organizationId: string;
  lastUpdated: string;
}

export interface NewsSummary {
  summary: string;
  newsCount: number;
  relevantNewsCount: number;
  organizationId: string;
  lastUpdated: string;
}

export interface ActionItemsData {
  actionItems: ActionItem[];
  count: number;
  organizationId: string;
  lastUpdated: string;
}

class NewsService {
  /**
   * Get raw news for an organization
   */
  async getRawNews(organizationId: string): Promise<NewsItem[]> {
    try {
      const response = await apiService.get(`/api/v1/news/${organizationId}`);
      return response.data.news;
    } catch (error: any) {
      console.error('Error fetching raw news:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch news');
    }
  }

  /**
   * Get action items for an organization
   */
  async getActionItems(organizationId: string): Promise<ActionItemsData> {
    try {
      const response = await apiService.get(`/api/v1/news/${organizationId}/action-items`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching action items:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch action items');
    }
  }

  /**
   * Get news summary for an organization
   */
  async getNewsSummary(organizationId: string): Promise<NewsSummary> {
    try {
      const response = await apiService.get(`/api/v1/news/${organizationId}/summary`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching news summary:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch news summary');
    }
  }

  /**
   * Get complete news data including news, summary, and action items
   */
  async getFullNewsData(organizationId: string): Promise<NewsData> {
    try {
      const response = await apiService.get(`/api/v1/news/${organizationId}/full`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching full news data:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch news data');
    }
  }

  /**
   * Get organization ID from current user context
   * This is a helper method - you may need to adjust based on your auth context
   */
  getCurrentOrganizationId(): string | null {
    // This should be implemented based on your authentication context
    // For now, we'll return null and let the caller provide the organization ID
    return null;
  }
}

const newsService = new NewsService();
export default newsService; 