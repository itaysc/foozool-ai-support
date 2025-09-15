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
export function generateMeetingPrepPrompt(customer: CustomerData, insights: InsightData[]): string {
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

MARKET CONTEXT:
Search for recent news and market developments relevant to ${customer.name || 'this customer'} in the ${customer.industry || 'technology'} industry. Focus on:
- Recent company announcements, partnerships, or product launches
- Industry trends and market developments
- Competitor activities and market positioning
- Regulatory changes or market disruptions
- Financial performance and business updates

INSTRUCTIONS:
Create a detailed meeting prep document with these sections:
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

Make each section detailed and actionable. Use specific data from the customer profile and insights. For market context, search for and include relevant recent news about the customer and their industry. End with "END OF DOCUMENT" to signal completion.`;
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
