import { InsightModel } from '../../schemas/insights.schema';
import { CustomerModel } from '../../schemas';
import mongoose from 'mongoose';
import { UserContextManager } from '../../context/userContext';
import { generateCustomerSuccessInsights, getSavedStakeholderInsights, getAllSavedCustomerSuccessInsights } from './customerSuccess.service';
import { HealthScoreService } from './healthScore.service';
import { DataIntelligenceService } from './dataIntelligence.service';
import { callLLM } from '../llm';
import { generateMeetingPrepPdf, MeetingPrepData } from '../pdf/meetingPrepPdf.service';
import { 
  generateMeetingPrepPrompt, 
  generateSimpleMeetingPrepPrompt,
  MEETING_PREP_SYSTEM_MESSAGE,
  SIMPLE_MEETING_PREP_SYSTEM_MESSAGE,
  CustomerData,
  InsightData
} from './prompts';
import { RiskAssessmentService } from '../customers/riskAssessment.service';
import { EnhancedMeetingPrepPromptGenerator } from '../customers/enhancedMeetingPrepPrompt.service';

export interface DateFilter {
  fromDate?: string;
  toDate?: string;
}

export interface InsightsQueryResult {
  success: boolean;
  data: any[];
  count: number;
}

export interface InsightsSummaryResult {
  success: boolean;
  data: {
    totalInsights: number;
    totalTicketVolume: number;
    avgGrowthRate: number;
    maxGrowthRate: number;
    minGrowthRate: number;
    mostRecentUpdate: Date | null;
  };
}

export interface CustomerSuccessInsightsResult {
  status: number;
  payload?: {
    freshInsights: any[];
    savedInsights: any[];
    allInsights: any[];
  };
  error?: string;
}

export interface AllCustomerSuccessInsightsResult {
  status: number;
  payload?: Array<{ customerId: string; customerName?: string; insights: any[] }>;
  error?: string;
}

export interface MeetingPrepResult {
  pdfDoc: any;
  filename: string;
}

/**
 * Get insights for a specific organization with optional date filtering
 */
export async function getInsightsByOrganization(
  dateFilter?: DateFilter
): Promise<InsightsQueryResult> {
  // Get organization ID from user context
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }

  // Build query filter
  const queryFilter: any = { 
    organizationId: organizationId 
  };

  // Add date filtering if provided
  if (dateFilter?.fromDate || dateFilter?.toDate) {
    queryFilter.lastUpdatedAt = {};
    
    if (dateFilter.fromDate) {
      queryFilter.lastUpdatedAt.$gte = new Date(dateFilter.fromDate);
    }
    
    if (dateFilter.toDate) {
      // Add one day to include the entire toDate
      const toDateObj = new Date(dateFilter.toDate);
      toDateObj.setDate(toDateObj.getDate() + 1);
      queryFilter.lastUpdatedAt.$lt = toDateObj;
    }
  }

  // Fetch insights for the organization, sorted by most recent
  const insights = await InsightModel.find(queryFilter)
    .sort({ lastUpdatedAt: -1 })
    .limit(50) // Limit to 50 most recent insights
    .lean(); // Use lean() for better performance

  // Transform the data to ensure proper format
  const formattedInsights = insights.map(insight => ({
    clusterId: insight.clusterId,
    organizationId: insight.organizationId.toString(),
    issueDescription: insight.issueDescription,
    ticketVolume: insight.ticketVolume,
    growthRate: insight.growthRate,
    firstDetectedAt: insight.firstDetectedAt.toISOString(),
    lastUpdatedAt: insight.lastUpdatedAt.toISOString(),
  }));

  console.log(`Retrieved ${formattedInsights.length} insights for organization ${organizationId}`);
  
  return {
    success: true,
    data: formattedInsights,
    count: formattedInsights.length
  };
}

/**
 * Get insights summary for a specific organization with optional date filtering
 */
export async function getInsightsSummary(
  dateFilter?: DateFilter
): Promise<InsightsSummaryResult> {
  // Get organization ID from user context
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }
  
  // Build match filter for aggregation
  const matchFilter: any = { organizationId: organizationId };
  
  // Add date filtering if provided
  if (dateFilter?.fromDate || dateFilter?.toDate) {
    matchFilter.lastUpdatedAt = {};
    
    if (dateFilter.fromDate) {
      matchFilter.lastUpdatedAt.$gte = new Date(dateFilter.fromDate);
    }
    
    if (dateFilter.toDate) {
      // Add one day to include the entire toDate
      const toDateObj = new Date(dateFilter.toDate);
      toDateObj.setDate(toDateObj.getDate() + 1);
      matchFilter.lastUpdatedAt.$lt = toDateObj;
    }
  }
  
  // Get aggregated statistics
  const stats = await InsightModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalInsights: { $sum: 1 },
        totalTicketVolume: { $sum: '$ticketVolume' },
        avgGrowthRate: { $avg: '$growthRate' },
        maxGrowthRate: { $max: '$growthRate' },
        minGrowthRate: { $min: '$growthRate' },
        mostRecentUpdate: { $max: '$lastUpdatedAt' }
      }
    }
  ]);

  const summary = stats.length > 0 ? stats[0] : {
    totalInsights: 0,
    totalTicketVolume: 0,
    avgGrowthRate: 0,
    maxGrowthRate: 0,
    minGrowthRate: 0,
    mostRecentUpdate: null
  };

  // Remove the _id field from aggregation result
  delete summary._id;

  return {
    success: true,
    data: summary
  };
}

/**
 * Get all insights (admin endpoint)
 */
export async function getAllInsights(limit = 100, skip = 0): Promise<InsightsQueryResult> {
  const insights = await InsightModel.find({})
    .sort({ lastUpdatedAt: -1 })
    .limit(parseInt(limit.toString()))
    .skip(parseInt(skip.toString()))
    .populate('organizationId', 'name') // Populate organization name
    .lean();

  const formattedInsights = insights.map(insight => ({
    clusterId: insight.clusterId,
    organizationId: insight.organizationId,
    issueDescription: insight.issueDescription,
    ticketVolume: insight.ticketVolume,
    growthRate: insight.growthRate,
    firstDetectedAt: insight.firstDetectedAt.toISOString(),
    lastUpdatedAt: insight.lastUpdatedAt.toISOString(),
  }));

  return {
    success: true,
    data: formattedInsights,
    count: formattedInsights.length
  };
}

/**
 * Get customer success insights for a specific customer (from persisted data only)
 */
export async function getCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    // DB-only fetch: return all saved customer success insights (no on-demand generation here)
    const savedInsights = await getAllSavedCustomerSuccessInsights(customerId);
    const freshInsights: any[] = [];
    const allInsights = savedInsights;
    
    return { 
      status: 200, 
      payload: {
        freshInsights,
        savedInsights,
        allInsights
      }
    };
  } catch (err) {
    console.error('Error fetching CS insights:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Generate and persist customer success insights on-demand (for job execution)
 */
export async function generateAndSaveCustomerSuccessInsights(customerId: string): Promise<CustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    // Generate fresh insights and persist them to database
    const freshInsights = await generateCustomerSuccessInsights(customerId);
    
    // Return the generated insights (they are now persisted)
    return {
      status: 200,
      payload: {
        freshInsights,
        savedInsights: freshInsights, // Same as fresh since they're now persisted
        allInsights: freshInsights
      }
    };
  } catch (err) {
    console.error('Error generating and saving CS insights:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Get customer success insights for all customers in the organization
 */
export async function getAllCustomerSuccessInsights(): Promise<AllCustomerSuccessInsightsResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    const customers = await CustomerModel.find({ organizationId })
      .select({ _id: 1, name: 1 })
      .lean();

    const results: Array<{ customerId: string; customerName?: string; insights: any[] }> = [];
    for (const c of customers) {
      // DB-only fetch: all saved customer success insights per customer (no on-demand generation)
      const insights = await getAllSavedCustomerSuccessInsights(String(c._id));
      results.push({ customerId: String(c._id), customerName: c.name, insights });
    }

    return { status: 200, payload: results };
  } catch (err) {
    console.error('Error generating CS insights for all customers:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Generate customer meeting prep document
 */
export async function generateCustomerMeetingPrep(customerId: string): Promise<MeetingPrepResult> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error('Organization ID not found in user context');
  }

  // Get customer details
  const customer = await CustomerModel.findOne({ 
    _id: customerId, 
    organizationId 
  }).lean();

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Get customer success insights
  const insights = await generateCustomerSuccessInsights(customerId);

  // Get comprehensive health score
  const healthScoreService = new HealthScoreService();
  const healthScore = await healthScoreService.calculateHealthScore(customerId, organizationId);

  // Get CUSTOMER-SPECIFIC CSAT insights (not organization-wide)
  let csatInsights: any = null;
  try {
    const { SurveysService } = await import('../surveys');
    const surveysService = SurveysService.getInstance();
    csatInsights = await surveysService.getSurveyInsights(organizationId, 'csat', customerId);
  } catch (error) {
    console.log('CSAT insights not available for customer:', error);
  }

  // Get news about the customer company
  let customerNews: any = null;
  try {
    const { newsService } = await import('../news');
    customerNews = await newsService.getNewsForCustomer(customerId);
    console.log(`📰 Fetched ${customerNews?.news?.length || 0} news items about ${customer.name}`);
    console.log('📰 News data structure:', {
      hasNews: !!customerNews?.news,
      newsLength: customerNews?.news?.length || 0,
      hasSummary: !!customerNews?.summary,
      hasActionItems: !!customerNews?.actionItems,
      actionItemsLength: customerNews?.actionItems?.length || 0
    });
  } catch (error) {
    console.log('Customer news not available for meeting prep:', error);
    console.log('Customer data for news generation:', {
      name: customer.name,
      hasPublicListing: !!customer.publicListing,
      ticker: customer.publicListing?.ticker,
      hasHq: !!customer.hq,
      country: customer.hq?.country
    });
  }

  // Get ticket data for enhanced analysis
  let ticketData: any = null;
  try {
    const qdrantService = new (await import('../../qdrant/service')).default();
    ticketData = await qdrantService.getCustomerTicketStats(customerId);
  } catch (error) {
    console.log('Ticket data not available for meeting prep:', error);
  }

  // Perform risk assessment (after we have all the data)
  const riskAssessmentService = new RiskAssessmentService();
  const risks = await riskAssessmentService.assessCustomerRisks(customerId, healthScore, insights, customerNews);

  // Generate enhanced meeting prep document using new system
  const customerData: CustomerData = customer;
  const insightData: InsightData[] = insights;
  
  const enhancedPromptGenerator = new EnhancedMeetingPrepPromptGenerator();
  const meetingPrepPrompt = enhancedPromptGenerator.generateEnhancedMeetingPrepPrompt(
    customerData,
    healthScore,
    risks,
    insightData,
    csatInsights,
    customerNews,
    ticketData
  );

  // Get userId from user context (guaranteed by middleware)
  const userId = UserContextManager.getCurrentUserId();
  
  if (!userId) {
    throw new Error('User ID is required for LLM operations');
  }

  console.log(`Generating meeting prep document for customer ${customerId} by user ${userId}`);

  let meetingPrepDocument: string;
  try {
    const llmResponse = await callLLM({
      userId,
      prompt: meetingPrepPrompt,
      maxTokens: 5000,
      temperature: 0.3,
      topP: 0.9,
      stop: ['END OF DOCUMENT'],
      systemMsg: MEETING_PREP_SYSTEM_MESSAGE,
      isChat: true
    });

    meetingPrepDocument = llmResponse.data || 'Failed to generate meeting prep document';
    
    console.log(`LLM response length: ${meetingPrepDocument.length} characters`);
    console.log(`LLM response preview: ${meetingPrepDocument.substring(0, 500)}...`);
    console.log(`LLM response full content:`, meetingPrepDocument);
    
    // If the response is too short, it might be incomplete
    if (meetingPrepDocument.length < 500) {
      console.warn('LLM response appears to be incomplete, attempting to generate a more detailed response');
      
      // Try a simpler, more direct prompt with key customer data
      const simplePrompt = generateSimpleMeetingPrepPrompt(customerData, insightData);

      const retryResponse = await callLLM({
        userId,
        prompt: simplePrompt,
        maxTokens: 5000,
        temperature: 0.3,
        topP: 0.9,
        stop: ['END OF DOCUMENT'],
        systemMsg: SIMPLE_MEETING_PREP_SYSTEM_MESSAGE,
        isChat: true
      });
      
      if (retryResponse.data && retryResponse.data.length > meetingPrepDocument.length) {
        meetingPrepDocument = retryResponse.data;
        console.log(`Retry successful, new length: ${meetingPrepDocument.length} characters`);
      }
    }
  } catch (llmError) {
    console.error('LLM call failed for meeting prep generation:', llmError);
    throw new Error('Failed to generate meeting prep document. Please try again.');
  }

  // Debug: Log the content being passed to PDF
  console.log('=== PDF GENERATION DEBUG ===');
  console.log('Customer name:', customer.name);
  console.log('Insights count:', insights.length);
  console.log('Document content length:', meetingPrepDocument.length);
  console.log('Document content preview:', meetingPrepDocument.substring(0, 1000));
  console.log('Customer news data:', {
    hasCustomerNews: !!customerNews,
    newsCount: customerNews?.news?.length || 0,
    hasSummary: !!customerNews?.summary,
    hasActionItems: !!customerNews?.actionItems,
    actionItemsCount: customerNews?.actionItems?.length || 0
  });
  console.log('=== END DEBUG ===');

  // Generate PDF document with enhanced data
  const pdfData: MeetingPrepData = {
    customer: {
      name: customer.name || 'Unknown Customer',
      industry: customer.industry,
      companySize: customer.companySize,
      segment: customer.segment,
      contractValue: customer.contractValue ? `$${customer.contractValue.toLocaleString()}` : undefined,
      startDate: customer.startDate ? new Date(customer.startDate).toLocaleDateString() : undefined,
      accountManager: customer.accountManager,
      healthScore: healthScore.overallScore.toString(),
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
    documentContent: meetingPrepDocument,
    generatedAt: new Date(),
    generatedBy: UserContextManager.getCurrentUserId() || 'System',
    // Add risk assessment data for PDF
    riskAssessment: risks,
    healthScore: healthScore,
    // Add customer news data for PDF
    customerNews: customerNews
  };

  const pdfDoc = generateMeetingPrepPdf(pdfData);
  const filename = `meeting-prep-${customer.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer'}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { pdfDoc, filename };
}
