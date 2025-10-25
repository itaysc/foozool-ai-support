import { CustomerModel } from '../../../schemas';
import { UserContextManager } from '../../../context/userContext';
import { MeetingPrepResult } from '../../insights/types';
import { getCustomerTicketStats } from '../../../qdrant/service';
import { MeetingPrepCacheService } from '../../cache/meetingPrepCache.service';
import { MeetingPrepData } from '../../pdf/meetingPrepPdf.service';
import { CustomerSuccessInsight } from '../../../types/customerSuccessInsight';
import { HealthScoreFactors } from '../../insights/healthScore.service';
import { callLLM } from '../../llm';

// Import modular services
import { transformInsights, fetchInsightsFromDB } from './insights.service';
import { calculateHealthScore, validateHealthScore } from './healthScore.service';
import { generateEnhancedMeetingPrepContent, generateMinimalEnhancedContent } from './enhanced-content.generator';
import { generatePdfBuffer, generateFilename } from './pdf.generator';
import { NewsResult } from '../../news';
import sanitizeText from 'src/utils/text-sanitize';

/**
 * Transform InsightTransformation to CustomerSuccessInsight
 */
function transformToCustomerSuccessInsight(insight: any): CustomerSuccessInsight {
  return {
    id: insight.id,
    type: insight.type as CustomerSuccessInsight['type'],
    message: insight.message,
    severity: insight.severity as CustomerSuccessInsight['severity'],
    category: insight.category as CustomerSuccessInsight['category'],
    meta: insight.meta,
    assignee: insight.assignee,
    status: insight.status as CustomerSuccessInsight['status'],
    createdAt: insight.detectedAt?.toISOString(),
    customerId: insight.customerId,
    customerName: insight.customerName,
    guidance: insight.guidance,
    evidence: insight.evidence
  };
}

/**
 * Transform HealthScoreData to HealthScoreFactors
 */
function transformToHealthScoreFactors(healthScore: any): HealthScoreFactors {
  return {
    supportHealth: {
      score: healthScore.supportHealth.score,
      factors: {
        ticketVolume: 0, // Default values since we don't have this data
        avgSentiment: 0,
        escalationRate: 0,
        resolutionTime: 0,
        csatRisk: 0
      }
    },
    engagementHealth: {
      score: healthScore.engagementHealth.score,
      factors: {
        stakeholderEngagement: 0,
        meetingFrequency: 0,
        featureAdoption: 0,
        responseTime: 0
      }
    },
    businessHealth: {
      score: healthScore.businessHealth.score,
      factors: {
        contractValue: 0,
        usageGrowth: 0,
        renewalRisk: 0,
        expansionOpportunity: 0
      }
    },
    overallScore: healthScore.overallScore,
    trend: healthScore.trend,
    lastUpdated: healthScore.lastUpdated
  };
}

/**
 * Generate customer meeting prep document V2 - Lightweight version
 * Minimizes LLM calls while providing comprehensive content
 */
export async function generateCustomerMeetingPrepV2(
  customerId: string, 
  forceRegenerate: boolean = false
): Promise<MeetingPrepResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }

  const cacheService = MeetingPrepCacheService.getInstance();
  
  // Check cache first unless force regeneration is requested
  if (!forceRegenerate) {
    try {
      const cachedResult = await cacheService.getCachedMeetingPrep(organizationId, customerId);
      if (cachedResult) {
        console.log(`📋 Using cached meeting prep document V2 for customer ${customerId}`);
        return cachedResult;
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with fresh generation:', error);
    }
  }

  console.log(`🚀 Generating lightweight meeting prep document V2 for customer ${customerId}`);

  // Fetch customer data
  const customer = await CustomerModel.findOne({ 
    _id: customerId, 
    organizationId 
  }).lean();

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Validate health score
  validateHealthScore(customer);

  // Fetch and transform insights
  const dbInsights = await fetchInsightsFromDB(customerId, organizationId);
  const transformedInsights = transformInsights(dbInsights, customer.name);
  const insights = transformedInsights.map(transformToCustomerSuccessInsight);

  // Calculate health score
  const healthScoreData = calculateHealthScore(customer);
  const healthScore = transformToHealthScoreFactors(healthScoreData);

  // Fetch ticket stats
  let ticketStats = null;
  try {
    ticketStats = await getCustomerTicketStats(customerId);
  } catch (error) {
    console.log('Ticket data not available for meeting prep V2:', error);
  }

  // Fetch customer news using LLM
  let customerNews: any = null;
  try {
    const newsPrompt = `Generate recent news and market context about ${customer.name} for a customer success meeting preparation document.

Customer Details:
- Company: ${customer.name}
- Industry: ${customer.industry || 'Not specified'}
- Company Size: ${customer.companySize || 'Not specified'}
- Segment: ${customer.segment || 'Not specified'}
- Headquarters: ${customer.hq?.country || 'Not specified'}

Please provide a valid JSON array of news items with the following structure:
[
  {
    "title": "Brief headline of the news item",
    "summary": "One-sentence summary of the news",
    "category": "company_news|industry_trends|business_development|market_context",
    "relevance": "high|medium|low"
  }
]

Focus on:
1. Recent company news (last few weeks)
2. Industry trends affecting this company
3. Market context relevant to customer success
4. Any significant business developments

Return ONLY the JSON array, no other text or formatting.`;

    const newsResponse = await callLLM({
      userId: UserContextManager.getCurrentUserId() || 'system',
      prompt: newsPrompt,
      isChat: true,
      systemMsg: 'You are a business intelligence analyst providing market context for customer success managers. Return only valid JSON.',
      maxTokens: 600
    });

    // Parse the JSON response
    let newsItems: any[] = [];
    try {
      const jsonData = JSON.parse(newsResponse.data || '[]');
      if (Array.isArray(jsonData)) {
        newsItems = jsonData;
      }
    } catch (error) {
      console.warn('Failed to parse LLM news JSON response:', error);
      // Fallback to empty array
      newsItems = [];
    }

    customerNews = {
      items: newsItems,
      generated: true
    };
    
    console.log(`📰 Generated LLM news summary for ${customer.name}`);
  } catch (error) {
    console.log('Failed to generate news summary with LLM:', error);
    customerNews = {
      summary: 'Unable to generate recent news summary at this time.',
      generated: false
    };
  }

  // Generate document content
  const documentContent = await generateEnhancedMeetingPrepContent({
    customer,
    insights: transformedInsights,
    healthScore: healthScoreData,
    ticketStats,
    customerNews: customerNews || undefined,
    generatedAt: new Date(),
    generatedBy: UserContextManager.getCurrentUserId() || 'System'
  });

  console.log(`📄 Generated meeting prep document V2 content: ${documentContent.length} characters`);

  // Prepare PDF data
  const pdfData: MeetingPrepData = {
    customer: {
      name: customer.name,
      industry: customer.industry,
      companySize: customer.companySize,
      segment: customer.segment,
      contractValue: customer.financialMetrics?.contractValue 
        ? `$${customer.financialMetrics.contractValue.toLocaleString()}` 
        : undefined,
      startDate: customer.startDate 
        ? new Date(customer.startDate).toLocaleDateString() 
        : undefined,
      accountManager: customer.accountManager,
      healthScore: healthScoreData.overallScore.toString(),
      operatingRegions: customer.operatingRegions,
      countriesServed: customer.countriesServed,
      languages: customer.languages,
      exchange: customer.publicListing?.exchange,
      ticker: customer.publicListing?.ticker,
      domains: customer.domains,
      competitorNames: customer.competitorNames,
      productLines: customer.productLines,
      newsKeywords: customer.newsKeywords,
      excludedKeywords: customer.excludedKeywords,
      website: customer.website,
      hq: customer.hq,
      usageData: customer.usageData ? {
        activeUsersCount: customer.usageData.activeUsersCount?.toString(),
        seatsPurchased: customer.usageData.seatsPurchased?.toString(),
        seatsUsed: customer.usageData.seatsUsed?.toString()
      } : undefined,
      notes: customer.notes
    },
    insights,
    documentContent,
    generatedAt: new Date(),
    generatedBy: UserContextManager.getCurrentUserId() || 'System',
    healthScore,
    customerNews: customerNews || undefined
  };

  // Generate PDF buffer
  const pdfBuffer = await generatePdfBuffer(pdfData);
  
  if (!customer.name) {
    throw new Error('Customer name is required to generate filename');
  }
  const filename = generateFilename(customer.name);
  
  // Cache the generated document
  console.log('📋 Starting to cache the generated document...');
  try {
    const cachePromise = cacheService.cacheMeetingPrep(
      organizationId,
      customerId,
      customer.name,
      pdfBuffer,
      filename,
      UserContextManager.getCurrentUserId() || 'System'
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache operation timed out')), 30000);
    });
    
    await Promise.race([cachePromise, timeoutPromise]);
    console.log(`💾 Cached meeting prep document V2 for customer ${customerId}`);
  } catch (error) {
    console.warn('Failed to cache meeting prep document V2:', error);
  }
  console.log('📋 Caching completed');
  
  console.log('📄 Returning PDF buffer and filename to client...');
  return { pdfBuffer, filename };
}

/**
 * Generate meeting prep document V2 Minimal - Streamlined version
 */
export async function generateCustomerMeetingPrepV2Minimal(
  customerId: string, 
  forceRegenerate: boolean = false
): Promise<MeetingPrepResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }

  const cacheService = MeetingPrepCacheService.getInstance();
  
  // Check cache first unless force regeneration is requested
  if (!forceRegenerate) {
    try {
      const cachedResult = await cacheService.getCachedMeetingPrep(organizationId, customerId);
      if (cachedResult) {
        console.log(`📋 Using cached meeting prep document V2 Minimal for customer ${customerId}`);
        return cachedResult;
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with fresh generation:', error);
    }
  }

  console.log(`🚀 Generating minimal meeting prep document V2 for customer ${customerId}`);

  // Fetch customer data
  const customer = await CustomerModel.findOne({ 
    _id: customerId, 
    organizationId 
  }).lean();

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Validate health score
  validateHealthScore(customer);

  // Fetch and transform insights (fewer insights for minimal version)
  const dbInsights = await fetchInsightsFromDB(customerId, organizationId, 10);
  const transformedInsights = transformInsights(dbInsights, customer.name);
  const insights = transformedInsights.map(transformToCustomerSuccessInsight);

  // Calculate health score
  const healthScoreData = calculateHealthScore(customer);
  const healthScore = transformToHealthScoreFactors(healthScoreData);

  // Fetch ticket stats
  let ticketStats = null;
  try {
    ticketStats = await getCustomerTicketStats(customerId);
  } catch (error) {
    console.log('Ticket data not available for meeting prep V2 Minimal:', error);
  }

  // Fetch customer news using LLM
  let customerNews: any = null;
  try {
    const newsPrompt = `Generate recent news and market context about ${customer.name} for a customer success meeting preparation document.

Customer Details:
- Company: ${customer.name}
- Industry: ${customer.industry || 'Not specified'}
- Company Size: ${customer.companySize || 'Not specified'}
- Segment: ${customer.segment || 'Not specified'}
- Headquarters: ${customer.hq?.country || 'Not specified'}

Please provide a JSON array of news items with the following structure:
[
  {
    "title": "Brief headline of the news item",
    "summary": "One-sentence summary of the news",
    "category": "company_news|industry_trends|business_development|market_context",
    "relevance": "high|medium|low"
  }
]

Return ONLY the JSON array, no other text or formatting.`;

    const newsResponse = await callLLM({
      userId: UserContextManager.getCurrentUserId() || 'system',
      prompt: newsPrompt,
      isChat: true,
      systemMsg: 'You are a business intelligence analyst providing market context for customer success managers. Return only valid JSON.',
      maxTokens: 400
    });

    // Parse the JSON response
    let newsItems: any[] = [];
    try {
      const jsonData = JSON.parse(newsResponse.data || '[]');
      if (Array.isArray(jsonData)) {
        newsItems = jsonData;
      }
    } catch (error) {
      console.warn('Failed to parse LLM news JSON response:', error);
      // Fallback to empty array
      newsItems = [];
    }

    customerNews = {
      items: newsItems,
      generated: true
    };
    
    console.log(`📰 Generated LLM news summary for ${customer.name} (minimal)`);
  } catch (error) {
    console.log('Failed to generate news summary with LLM:', error);
    customerNews = {
      summary: 'Unable to generate recent news summary at this time.',
      generated: false
    };
  }

  // Generate minimal content
  const documentContent = await generateMinimalEnhancedContent({
    customer,
    insights: transformedInsights,
    healthScore: healthScoreData,
    ticketStats,
    customerNews,
    generatedAt: new Date(),
    generatedBy: UserContextManager.getCurrentUserId() || 'System'
  });

  console.log(`📄 Generated meeting prep document V2 Minimal content: ${documentContent.length} characters`);

  // Prepare PDF data (same structure)
  const pdfData: MeetingPrepData = {
    customer: {
      name: customer.name,
      industry: customer.industry,
      companySize: customer.companySize,
      segment: customer.segment,
      contractValue: customer.financialMetrics?.contractValue 
        ? `$${customer.financialMetrics.contractValue.toLocaleString()}` 
        : undefined,
      startDate: customer.startDate 
        ? new Date(customer.startDate).toLocaleDateString() 
        : undefined,
      accountManager: customer.accountManager,
      healthScore: healthScoreData.overallScore.toString(),
      operatingRegions: customer.operatingRegions,
      countriesServed: customer.countriesServed,
      languages: customer.languages,
      exchange: customer.publicListing?.exchange,
      ticker: customer.publicListing?.ticker,
      domains: customer.domains,
      competitorNames: customer.competitorNames,
      productLines: customer.productLines,
      newsKeywords: customer.newsKeywords,
      excludedKeywords: customer.excludedKeywords,
      website: customer.website,
      hq: customer.hq,
      usageData: customer.usageData ? {
        activeUsersCount: customer.usageData.activeUsersCount?.toString(),
        seatsPurchased: customer.usageData.seatsPurchased?.toString(),
        seatsUsed: customer.usageData.seatsUsed?.toString()
      } : undefined,
      notes: customer.notes
    },
    insights,
    documentContent,
    generatedAt: new Date(),
    generatedBy: UserContextManager.getCurrentUserId() || 'System',
    healthScore,
    customerNews: customerNews || undefined
  };

  // Generate PDF buffer
  const pdfBuffer = await generatePdfBuffer(pdfData);
  
  const filename = `meeting-prep-minimal-${customer.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer'}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Cache the generated document
  console.log('📋 Starting to cache the generated document (minimal)...');
  try {
    const cachePromise = cacheService.cacheMeetingPrep(
      organizationId,
      customerId,
      customer.name,
      pdfBuffer,
      filename,
      UserContextManager.getCurrentUserId() || 'System'
    );
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache operation timed out')), 30000);
    });
    
    await Promise.race([cachePromise, timeoutPromise]);
    console.log(`💾 Cached meeting prep document V2 Minimal for customer ${customerId}`);
  } catch (error) {
    console.warn('Failed to cache meeting prep document V2 Minimal:', error);
  }
  console.log('📋 Caching completed (minimal)');
  
  console.log('📄 Returning PDF buffer and filename to client (minimal)...');
  return { pdfBuffer, filename };
}
