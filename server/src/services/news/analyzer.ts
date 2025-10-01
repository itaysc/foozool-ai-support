/**
 * News Analyzer - Handles analysis of news items and generation of action items
 */

import { callLLM } from '../llm';
import { summarizeTickets } from '../call-python';
import { NewsItem, ProcessedNewsItem, ActionItem } from './types';
import {
  generateNewsAnalysisPrompt,
  generateOrganizationActionItemsPrompt,
  generateCustomerNewsAnalysisPrompt,
  generateCustomerActionItemsPrompt
} from './prompts';

export class NewsAnalyzer {
  /**
   * Analyze organization news items
   */
  async analyzeOrganizationNews(newsItems: NewsItem[], organization: any, userId: string): Promise<ProcessedNewsItem[]> {
    const processedItems: ProcessedNewsItem[] = [];
    
    for (const item of newsItems.slice(0, 20)) { // Limit to 20 items for processing
      try {
        // Create a combined text for analysis
        const combinedText = `${item.title}. ${item.contentSnippet}`;
        
        // Analyze relevance and impact using LLM
        const analysisPrompt = generateNewsAnalysisPrompt(
          combinedText,
          organization.details || 'various industries',
          organization.country || 'multiple countries',
          organization.regions || []
        );
        
        const analysisResponse = await callLLM({
          userId: 'system',
          prompt: analysisPrompt,
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
   * Analyze customer company news (CS perspective)
   */
  async analyzeCustomerNews(newsItems: NewsItem[], customer: any, userId: string): Promise<ProcessedNewsItem[]> {
    const processedItems: ProcessedNewsItem[] = [];
    
    for (const item of newsItems.slice(0, 15)) {
      try {
        const combinedText = `${item.title}. ${item.contentSnippet}`;
        
        const analysisPrompt = generateCustomerNewsAnalysisPrompt(
          combinedText,
          customer.name || 'the customer company',
          customer.industry || 'N/A',
          customer.segment || 'N/A',
          customer.healthScore || 0
        );
        
        const analysisResponse = await callLLM({
          userId,
          prompt: analysisPrompt,
          maxTokens: 200,
          temperature: 0.3,
          topP: 0.9
        });
        
        let analysis;
        try {
          analysis = JSON.parse(analysisResponse.data || '{}');
        } catch {
          analysis = { relevance: 'medium', impact: 'neutral', categories: ['general'] };
        }
        
        processedItems.push({
          ...item,
          relevance: analysis.relevance || 'medium',
          impact: analysis.impact || 'neutral',
          categories: analysis.categories || ['general']
        });
        
      } catch (error) {
        console.error('Error analyzing customer news item:', error);
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
   * Summarize customer news for CS team
   */
  async summarizeCustomerNews(newsItems: ProcessedNewsItem[], customer: any): Promise<string> {
    const relevantItems = newsItems.filter(item => 
      item.relevance === 'high' || item.relevance === 'medium'
    );
    
    if (relevantItems.length === 0) {
      return `No recent significant news found about ${customer.name}.`;
    }
    
    const summaryItems = relevantItems.slice(0, 5).map(item => 
      `• [${item.impact.toUpperCase()}] ${item.title} (${new Date(item.pubDate).toLocaleDateString()})`
    );
    
    return `Recent News About ${customer.name}:\n\n${summaryItems.join('\n')}`;
  }

  /**
   * Generate organization action items from news analysis
   */
  async generateOrganizationActionItems(newsItems: ProcessedNewsItem[], organization: any, userId: string): Promise<ActionItem[]> {
    try {
      const relevantItems = newsItems.filter(item => 
        item.relevance === 'high' || (item.relevance === 'medium' && item.impact !== 'neutral')
      );
      
      if (relevantItems.length === 0) {
        return [];
      }
      
      const actionItemsPrompt = generateOrganizationActionItemsPrompt(
        relevantItems,
        organization.details || 'various industries',
        organization.country || 'multiple countries',
        organization.regions || []
      );
      
      const actionItemsResponse = await callLLM({
        userId: 'system',
        prompt: actionItemsPrompt,
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
   * Generate CS action items based on customer news
   */
  async generateCustomerActionItems(newsItems: ProcessedNewsItem[], customer: any, userId: string): Promise<ActionItem[]> {
    const relevantItems = newsItems.filter(item => item.relevance === 'high');
    
    if (relevantItems.length === 0) {
      return [];
    }
    
    const prompt = generateCustomerActionItemsPrompt(
      relevantItems,
      customer.name || 'the customer',
      customer.industry || 'N/A',
      customer.healthScore || 0
    );
    
    try {
      const response = await callLLM({
        userId,
        prompt,
        maxTokens: 600,
        temperature: 0.3,
        topP: 0.9
      });
      
      const actionItems = JSON.parse(response.data || '[]');
      return Array.isArray(actionItems) ? actionItems : [];
    } catch (error) {
      console.error('Error generating customer action items:', error);
      return [];
    }
  }
}

