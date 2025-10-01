/**
 * Prompt utility functions for insights services
 * Contains all LLM prompts used in the insights module
 */

export interface CustomerData {
  name?: string;
  industry?: string;
  companySize?: string;
  segment?: string;
  contractValue?: string | number;
  startDate?: string | Date;
  accountManager?: string;
  healthScore?: string | number;
  operatingRegions?: string[];
  countriesServed?: string[];
  languages?: string[];
  publicListing?: {
    exchange?: string;
    ticker?: string;
  };
  domains?: string[];
  competitorNames?: string[];
  productLines?: string[];
  newsKeywords?: string[];
  excludedKeywords?: string[];
  website?: string;
  hq?: {
    country?: string;
    region?: string;
    city?: string;
  };
  usageData?: {
    activeUsersCount?: string | number;
    seatsPurchased?: string | number;
    seatsUsed?: string | number;
  };
  notes?: string;
}

export interface InsightData {
  type: string;
  category: string;
  severity: string;
  message: string;
  meta?: Record<string, any>;
}

/**
 * Generate comprehensive meeting prep prompt
 */
export function generateMeetingPrepPrompt(customer: CustomerData, insights: InsightData[], csatInsights?: any, customerNews?: any): string {
  return `Generate a comprehensive customer meeting preparation document for ${customer.name || 'this customer'}.

CUSTOMER PROFILE:
- Name: ${customer.name || 'N/A'}
- Industry: ${customer.industry || 'N/A'}
- Company Size: ${customer.companySize || 'N/A'}
- Segment: ${customer.segment || 'N/A'}
- Contract Value: ${customer.contractValue || 'N/A'}
- Start Date: ${customer.startDate || 'N/A'}
- Account Manager: ${customer.accountManager || 'N/A'}
- Health Score: ${customer.healthScore || 'N/A'}
- Operating Regions: ${customer.operatingRegions?.join(', ') || 'N/A'}
- Countries Served: ${customer.countriesServed?.join(', ') || 'N/A'}
- Languages: ${customer.languages?.join(', ') || 'N/A'}
- Exchange: ${customer.publicListing?.exchange || 'N/A'}
- Ticker: ${customer.publicListing?.ticker || 'N/A'}
- Domains: ${customer.domains?.join(', ') || 'N/A'}
- Competitors: ${customer.competitorNames?.join(', ') || 'N/A'}
- Product Lines: ${customer.productLines?.join(', ') || 'N/A'}
- News Keywords: ${customer.newsKeywords?.join(', ') || 'N/A'}
- Excluded Keywords: ${customer.excludedKeywords?.join(', ') || 'N/A'}
- Website: ${customer.website || 'N/A'}
- HQ Country: ${customer.hq?.country || 'N/A'}
- HQ Region: ${customer.hq?.region || 'N/A'}
- HQ City: ${customer.hq?.city || 'N/A'}
- Active Users: ${customer.usageData?.activeUsersCount || 'N/A'}
- Seats Purchased: ${customer.usageData?.seatsPurchased || 'N/A'}
- Seats Used: ${customer.usageData?.seatsUsed || 'N/A'}
- Notes: ${customer.notes || 'N/A'}

CUSTOMER SUCCESS INSIGHTS:
${insights.length > 0 ? insights.map(insight => `
- ${insight.type.replace(/_/g, ' ').toUpperCase()} (${insight.category}, ${insight.severity} severity)
  Message: ${insight.message}
  ${insight.meta ? `Details: ${JSON.stringify(insight.meta, null, 2)}` : ''}
`).join('\n') : 'No insights available'}

CUSTOMER SATISFACTION (CSAT) INSIGHTS:
${csatInsights ? `
- Overall CSAT Score: ${csatInsights.currentCSAT || 0}%
- Change from Previous Period: ${csatInsights.csatChange > 0 ? '+' : ''}${csatInsights.csatChange || 0}%
- Total Responses: ${csatInsights.totalResponses || 0}
- Response Rate: ${csatInsights.responseRate || 0}%

Key Insights:
${csatInsights.insights && csatInsights.insights.length > 0 ? csatInsights.insights.map((insight: string) => `- ${insight}`).join('\n') : 'No insights available'}

Recommendations:
${csatInsights.recommendations && csatInsights.recommendations.length > 0 ? csatInsights.recommendations.map((rec: string) => `- ${rec}`).join('\n') : 'No recommendations available'}

Score Distribution:
${csatInsights.scoreDistribution ? Object.entries(csatInsights.scoreDistribution).map(([score, count]) => `- ${score}: ${count} responses`).join('\n') : 'No distribution data available'}
` : 'No CSAT data available for this specific customer'}

RECENT NEWS ABOUT ${customer.name?.toUpperCase() || 'THE CUSTOMER'}:
${customerNews && customerNews.news && customerNews.news.length > 0 ? `
Real-time news and developments about the customer's company:

${customerNews.news
  .filter((item: any) => item.relevance === 'high' || item.relevance === 'medium')
  .slice(0, 8)
  .map((item: any, idx: number) => `
${idx + 1}. [${item.impact.toUpperCase()} IMPACT | ${item.relevance.toUpperCase()} RELEVANCE]
   Title: ${item.title}
   Published: ${new Date(item.pubDate).toLocaleDateString()}
   Source: ${item.source}
   Summary: ${item.contentSnippet}
   Link: ${item.link}
   Categories: ${item.categories?.join(', ') || 'General'}
`).join('\n')}

News Summary:
${customerNews.summary || 'No summary available'}

${customerNews.actionItems && customerNews.actionItems.length > 0 ? `
CS Team Action Items Based on News:
${customerNews.actionItems.map((action: any) => `
- [${action.priority.toUpperCase()} PRIORITY] ${action.title}
  ${action.description}
  Impact: ${action.impact}
  Category: ${action.category}
  Suggested Talking Points:
  ${action.suggestedActions?.map((a: string) => `  • ${a}`).join('\n') || '  • No specific actions'}
`).join('\n')}
` : ''}
` : `No recent news available about ${customer.name || 'this customer'}. The company may be private, not actively in the news, or our news search didn't find relevant articles.`}

INSTRUCTIONS:
Create a detailed meeting prep document with these sections:
1. EXECUTIVE SUMMARY - Include highlights from recent news about the customer
2. CUSTOMER HEALTH ASSESSMENT - Reference CSAT data and recent insights
3. STRATEGIC OPPORTUNITIES - Connect news events to potential opportunities
4. RISK MITIGATION - Flag any concerning news or trends
5. TALKING POINTS - Use news as conversation starters to build rapport
6. QUESTIONS TO ASK - Probe how recent events affect their needs and priorities
7. RECOMMENDATIONS - Provide actionable next steps
8. MARKET CONTEXT - Analyze how their recent news fits into industry trends
9. SUCCESS METRICS - Define what success looks like for this relationship
10. FOLLOW-UP ACTIONS - Specific tasks to complete before/after the meeting

KEY GUIDELINES:
- Use the ACTUAL recent news provided above - this is real-time data, not examples
- In TALKING POINTS, reference specific news articles to show you're paying attention to their company
- Show empathy for challenges (layoffs, losses) and enthusiasm for wins (funding, growth)
- Connect their company news to how your product/service can help
- If there's negative news (layoffs, financial troubles), approach with sensitivity
- If there's positive news (funding, expansion), identify growth opportunities
- Use specific dates, numbers, and details from the news provided
- Make the document conversational and human, not robotic

Make each section detailed, specific, and actionable. End with "END OF DOCUMENT" to signal completion.`;
}

/**
 * Generate simplified meeting prep prompt (fallback)
 */
export function generateSimpleMeetingPrepPrompt(customer: CustomerData, insights: InsightData[]): string {
  return `Create a detailed meeting preparation document for ${customer.name || 'this customer'}.

CUSTOMER DETAILS:
- Industry: ${customer.industry || 'N/A'}
- Company Size: ${customer.companySize || 'N/A'}
- Contract Value: ${customer.contractValue || 'N/A'}
- Health Score: ${customer.healthScore || 'N/A'}
- Account Manager: ${customer.accountManager || 'N/A'}
- Competitors: ${customer.competitorNames?.join(', ') || 'N/A'}
- Operating Regions: ${customer.operatingRegions?.join(', ') || 'N/A'}
- Usage: ${customer.usageData?.activeUsersCount || 'N/A'} active users, ${customer.usageData?.seatsUsed || 'N/A'}/${customer.usageData?.seatsPurchased || 'N/A'} seats used

INSIGHTS:
${insights.length > 0 ? insights.slice(0, 3).map(insight => `- ${insight.type.replace(/_/g, ' ')}: ${insight.message}`).join('\n') : 'No insights available'}

MARKET CONTEXT:
Search for recent news about ${customer.name || 'this customer'} and the ${customer.industry || 'technology'} industry.

Create detailed sections:
1. EXECUTIVE SUMMARY
2. CUSTOMER HEALTH ASSESSMENT
3. STRATEGIC OPPORTUNITIES
4. RISK MITIGATION
5. TALKING POINTS
6. QUESTIONS TO ASK
7. RECOMMENDATIONS
8. MARKET CONTEXT
9. SUCCESS METRICS
10. FOLLOW-UP ACTIONS

Make each section comprehensive and actionable. Include recent news and market context by searching online. End with "END OF DOCUMENT".`;
}

/**
 * System message for meeting prep generation
 */
export const MEETING_PREP_SYSTEM_MESSAGE = 'You are an expert Customer Success Manager. Generate comprehensive, detailed meeting preparation documents. Always complete all requested sections and end with "END OF DOCUMENT".';

/**
 * Simplified system message for meeting prep generation
 */
export const SIMPLE_MEETING_PREP_SYSTEM_MESSAGE = 'You are an expert Customer Success Manager. Generate detailed, comprehensive meeting preparation documents.';
