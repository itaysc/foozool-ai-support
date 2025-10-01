/**
 * Type definitions for news service
 */

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

export interface NewsResult {
  news: ProcessedNewsItem[];
  summary: string;
  actionItems: ActionItem[];
  rssUrl: string;
}

