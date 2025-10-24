import { CustomerModel } from '../../schemas';
import { UserContextManager } from '../../context/userContext';
import { generateCustomerSuccessInsights } from './customer-success';
import { HealthScoreService } from './healthScore.service';
import { callLLM } from '../llm';
import { generateMeetingPrepPdf, MeetingPrepData } from '../pdf/meetingPrepPdf.service';
import { 
  generateSimpleMeetingPrepPrompt,
  MEETING_PREP_SYSTEM_MESSAGE,
  SIMPLE_MEETING_PREP_SYSTEM_MESSAGE,
  CustomerData,
  InsightData
} from './prompts';
import { RiskAssessmentService } from '../customers/riskAssessment.service';
import { EnhancedMeetingPrepPromptGenerator } from '../customers/enhancedMeetingPrepPrompt.service';
import { MeetingPrepResult } from './types';
import { getCustomerTicketStats } from '../../qdrant/service';
import { MeetingPrepCacheService } from '../cache/meetingPrepCache.service';

/**
 * Generate customer meeting prep document with caching
 */
export async function generateCustomerMeetingPrep(customerId: string, forceRegenerate: boolean = false): Promise<MeetingPrepResult> {
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
        console.log(`📋 Using cached meeting prep document for customer ${customerId}`);
        return cachedResult;
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with fresh generation:', error);
    }
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
  
  // Generate health score risk insights if customer is at risk
  try {
    const healthScoreRiskInsights = await healthScoreService.generateHealthScoreRiskInsights(
      customerId, 
      organizationId, 
      healthScore
    );
    console.log(`[Health Score Insights] Generated ${healthScoreRiskInsights.length} health score risk insights for customer ${customerId}`);
  } catch (error) {
    console.error('[Health Score Insights] Error generating health score risk insights:', error);
  }

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
    ticketData = await getCustomerTicketStats(customerId);
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
      contractValue: customer.financialMetrics?.contractValue ? `$${customer.financialMetrics.contractValue.toLocaleString()}` : undefined,
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
  
  // Cache the generated document
  try {
    await cacheService.cacheMeetingPrep(
      organizationId,
      customerId,
      customer.name || 'Unknown Customer',
      pdfDoc,
      filename,
      UserContextManager.getCurrentUserId() || 'System'
    );
    console.log(`💾 Cached meeting prep document for customer ${customerId}`);
  } catch (error) {
    console.warn('Failed to cache meeting prep document:', error);
    // Don't throw error - caching failure shouldn't break the main flow
  }
  
  return { pdfDoc, filename };
}

