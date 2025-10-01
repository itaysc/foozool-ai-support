/**
 * RSS Fetcher - Handles fetching and parsing RSS feeds
 */

import Parser from 'rss-parser';
import { NewsItem } from './types';

export class RSSFetcher {
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
   * Generate Google News RSS URL with search query
   */
  generateRSSUrl(searchQuery: string, countryCode: string = 'US'): string {
    const baseUrl = 'https://news.google.com/rss/search?q=';
    const encodedQuery = encodeURIComponent(searchQuery);
    return `${baseUrl}${encodedQuery}&hl=en&gl=${countryCode}&ceid=${countryCode}:en`;
  }

  /**
   * Get country code from country name
   */
  getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Israel': 'IL',
      'Spain': 'ES',
      'Italy': 'IT',
      'Netherlands': 'NL',
      'Sweden': 'SE',
      'Switzerland': 'CH',
      'Singapore': 'SG',
      'Brazil': 'BR',
      'Mexico': 'MX',
    };
    return countryMap[country] || 'US';
  }
}

