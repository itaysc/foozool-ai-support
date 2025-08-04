import { makeAutoObservable, runInAction } from 'mobx';
import newsService, { 
  NewsData, 
  NewsSummary, 
  ActionItemsData, 
  NewsItem,
  ProcessedNewsItem,
  ActionItem 
} from '@/services/news-service';

class NewsStore {
  newsData: NewsData | null = null;
  newsSummary: NewsSummary | null = null;
  actionItems: ActionItemsData | null = null;
  rawNews: NewsItem[] = [];
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  cacheExpiry: Date | null = null;
  currentOrganizationId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setNewsData = (data: NewsData) => {
    this.newsData = data;
  };

  setNewsSummary = (summary: NewsSummary) => {
    this.newsSummary = summary;
  };

  setActionItems = (actionItems: ActionItemsData) => {
    this.actionItems = actionItems;
  };

  setRawNews = (news: NewsItem[]) => {
    this.rawNews = news;
  };

  setLastUpdated = (date: Date) => {
    this.lastUpdated = date;
  };

  setCacheExpiry = (date: Date) => {
    this.cacheExpiry = date;
  };

  setCurrentOrganizationId = (organizationId: string) => {
    this.currentOrganizationId = organizationId;
  };

  /**
   * Check if cache is still valid (4 hours)
   */
  get isCacheValid(): boolean {
    if (!this.cacheExpiry) return false;
    return new Date() < this.cacheExpiry;
  }

  /**
   * Check if we have data for the current organization
   */
  get hasData(): boolean {
    return !!(this.newsData || this.newsSummary || this.actionItems || this.rawNews.length > 0);
  }

  /**
   * Get high priority action items
   */
  get highPriorityActionItems(): ActionItem[] {
    if (!this.actionItems?.actionItems) return [];
    return this.actionItems.actionItems.filter(item => item.priority === 'high');
  }

  /**
   * Get medium priority action items
   */
  get mediumPriorityActionItems(): ActionItem[] {
    if (!this.actionItems?.actionItems) return [];
    return this.actionItems.actionItems.filter(item => item.priority === 'medium');
  }

  /**
   * Get low priority action items
   */
  get lowPriorityActionItems(): ActionItem[] {
    if (!this.actionItems?.actionItems) return [];
    return this.actionItems.actionItems.filter(item => item.priority === 'low');
  }

  /**
   * Get high relevance news items
   */
  get highRelevanceNews(): ProcessedNewsItem[] {
    if (!this.newsData?.news) return [];
    return this.newsData.news.filter(item => item.relevance === 'high');
  }

  /**
   * Get positive impact news items
   */
  get positiveImpactNews(): ProcessedNewsItem[] {
    if (!this.newsData?.news) return [];
    return this.newsData.news.filter(item => item.impact === 'positive');
  }

  /**
   * Get negative impact news items
   */
  get negativeImpactNews(): ProcessedNewsItem[] {
    if (!this.newsData?.news) return [];
    return this.newsData.news.filter(item => item.impact === 'negative');
  }

  /**
   * Fetch full news data for an organization
   */
  fetchFullNewsData = async (organizationId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setCurrentOrganizationId(organizationId);

      // Check cache first
      if (this.isCacheValid && this.currentOrganizationId === organizationId) {
        console.log('Using cached news data');
        return;
      }

      const data = await newsService.getFullNewsData(organizationId);
      
      runInAction(() => {
        this.setNewsData(data);
        this.setLastUpdated(new Date());
        // Set cache expiry to 4 hours from now
        this.setCacheExpiry(new Date(Date.now() + 4 * 60 * 60 * 1000));
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch news data');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  /**
   * Fetch only action items
   */
  fetchActionItems = async (organizationId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setCurrentOrganizationId(organizationId);

      const data = await newsService.getActionItems(organizationId);
      
      runInAction(() => {
        this.setActionItems(data);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch action items');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  /**
   * Fetch only news summary
   */
  fetchNewsSummary = async (organizationId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setCurrentOrganizationId(organizationId);

      const data = await newsService.getNewsSummary(organizationId);
      
      runInAction(() => {
        this.setNewsSummary(data);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch news summary');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  /**
   * Fetch raw news
   */
  fetchRawNews = async (organizationId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setCurrentOrganizationId(organizationId);

      const news = await newsService.getRawNews(organizationId);
      
      runInAction(() => {
        this.setRawNews(news);
        this.setLastUpdated(new Date());
      });
    } catch (error: any) {
      runInAction(() => {
        this.setError(error.message || 'Failed to fetch raw news');
      });
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  };

  /**
   * Clear all data
   */
  clearData = () => {
    this.newsData = null;
    this.newsSummary = null;
    this.actionItems = null;
    this.rawNews = [];
    this.error = null;
    this.lastUpdated = null;
    this.cacheExpiry = null;
    this.currentOrganizationId = null;
  };

  /**
   * Refresh all news data
   */
  refreshData = async (organizationId: string) => {
    this.clearData();
    await this.fetchFullNewsData(organizationId);
  };
}

const newsStore = new NewsStore();
export default newsStore; 