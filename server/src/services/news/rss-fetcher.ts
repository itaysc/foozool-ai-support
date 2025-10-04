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
      console.log(`📰 Fetching news from RSS: ${rssUrl}`);
      
      const feed = await this.parser.parseURL(rssUrl);
      console.log(`📰 RSS Feed parsed successfully. Items found: ${feed.items?.length || 0}`);
      
      const newsItems: NewsItem[] = [];
      
      if (feed.items) {
        feed.items.forEach((item, index) => {
          console.log(`📰 Item ${index + 1}: ${item.title?.substring(0, 50)}...`);
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
      
      console.log(`📰 Successfully fetched ${newsItems.length} news items`);
      return newsItems;
      
    } catch (error) {
      console.error('📰 Error fetching news from RSS:', error);
      console.error('📰 RSS URL that failed:', rssUrl);
      return [];
    }
  }

  /**
   * Generate Google News RSS URL with search query
   */
  generateRSSUrl(searchQuery: string, countryCode: string = 'US'): string {
    const baseUrl = 'https://news.google.com/rss/search?q=';
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `${baseUrl}${encodedQuery}&hl=en&gl=${countryCode}&ceid=${countryCode}:en`;
    console.log(`📰 Generated Google News RSS URL: ${url}`);
    return url;
  }

  /**
   * Generate alternative RSS URLs for better coverage
   */
  generateAlternativeRSSUrls(searchQuery: string, countryCode: string = 'US'): string[] {
    const urls: string[] = [];
    
    // Google News (primary)
    urls.push(this.generateRSSUrl(searchQuery, countryCode));
    
    // Try different search variations
    const variations = [
      searchQuery,
      searchQuery.replace(/"/g, ''), // Remove quotes
      searchQuery.split(' OR ')[0], // Just first term
    ];
    
    variations.forEach(variation => {
      if (variation !== searchQuery) {
        const baseUrl = 'https://news.google.com/rss/search?q=';
        const encodedQuery = encodeURIComponent(variation);
        urls.push(`${baseUrl}${encodedQuery}&hl=en&gl=${countryCode}&ceid=${countryCode}:en`);
      }
    });
    
    return urls;
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

