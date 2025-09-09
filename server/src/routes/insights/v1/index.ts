import express from 'express';
import { InsightModel } from '../../../schemas/insights.schema';
import mongoose from 'mongoose';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { UserContextManager } from '../../../context/userContext';
import { generateCustomerSuccessInsights } from '../../../services/insights/customerSuccess.service';
import { CustomerModel } from '../../../schemas';
import { callLLM } from '../../../services/llm';

const router = express.Router();

/**
 * GET /insights/customer-success/:customerId
 * Generate Customer Success risk insights for a specific customer (authenticated, org-scoped)
 * Place BEFORE dynamic /insights/:organizationId to avoid route conflicts.
 */
router.get('/customer-success/:customerId', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const { customerId } = req.params;
    if (!organizationId) {
      return res.status(400).json({ status: 400, error: 'Organization ID not found in user context' });
    }
    const insights = await generateCustomerSuccessInsights(customerId);
    return res.status(200).json({ status: 200, payload: insights });
  } catch (err) {
    console.error('Error generating CS insights:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

/**
 * GET /insights/customer-success
 * Generate Customer Success risk insights for ALL customers in the current organization (authenticated, org-scoped)
 */
router.get('/customer-success', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      return res.status(400).json({ status: 400, error: 'Organization ID not found in user context' });
    }

    const customers = await CustomerModel.find({ organizationId })
      .select({ _id: 1, name: 1 })
      .lean();

    const results: Array<{ customerId: string; customerName?: string; insights: any[] }> = [];
    for (const c of customers) {
      const insights = await generateCustomerSuccessInsights(String(c._id));
      results.push({ customerId: String(c._id), customerName: c.name, insights });
    }

    return res.status(200).json({ status: 200, count: results.length, payload: results });
  } catch (err) {
    console.error('Error generating CS insights for all customers:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

/**
 * POST /insights/customer-meeting-prep/:customerId
 * Generate a comprehensive customer meeting prep document for a specific customer
 */
router.post('/customer-meeting-prep/:customerId', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const { customerId } = req.params;
    
    if (!organizationId) {
      return res.status(400).json({ status: 400, error: 'Organization ID not found in user context' });
    }

    // Get customer details
    const customer = await CustomerModel.findOne({ 
      _id: customerId, 
      organizationId 
    }).lean();

    if (!customer) {
      return res.status(404).json({ status: 404, error: 'Customer not found' });
    }

    // Get customer success insights
    const insights = await generateCustomerSuccessInsights(customerId);

    // Note: LLM will search for relevant news online instead of using RSS data

    // Generate comprehensive meeting prep document using LLM
    const meetingPrepPrompt = `Generate a comprehensive customer meeting preparation document for ${customer.name || 'this customer'}.

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

    // Get userId from user context (guaranteed by middleware)
    const userId = UserContextManager.getCurrentUserId();
    
    if (!userId) {
      console.error('User ID not found in context for meeting prep generation');
      return res.status(400).json({ status: 400, error: 'User ID is required for LLM operations' });
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
        systemMsg: 'You are an expert Customer Success Manager. Generate comprehensive, detailed meeting preparation documents. Always complete all requested sections and end with "END OF DOCUMENT".',
        isChat: true
      });

      meetingPrepDocument = llmResponse.data || 'Failed to generate meeting prep document';
      
      console.log(`LLM response length: ${meetingPrepDocument.length} characters`);
      console.log(`LLM response preview: ${meetingPrepDocument.substring(0, 200)}...`);
      
      // If the response is too short, it might be incomplete
      if (meetingPrepDocument.length < 500) {
        console.warn('LLM response appears to be incomplete, attempting to generate a more detailed response');
        
        // Try a simpler, more direct prompt with key customer data
        const simplePrompt = `Create a detailed meeting preparation document for ${customer.name || 'this customer'}.

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

        const retryResponse = await callLLM({
          userId,
          prompt: simplePrompt,
          maxTokens: 5000,
          temperature: 0.3,
          topP: 0.9,
          stop: ['END OF DOCUMENT'],
          systemMsg: 'You are an expert Customer Success Manager. Generate detailed, comprehensive meeting preparation documents.',
          isChat: true
        });
        
        if (retryResponse.data && retryResponse.data.length > meetingPrepDocument.length) {
          meetingPrepDocument = retryResponse.data;
          console.log(`Retry successful, new length: ${meetingPrepDocument.length} characters`);
        }
      }
    } catch (llmError) {
      console.error('LLM call failed for meeting prep generation:', llmError);
      return res.status(500).json({ 
        status: 500, 
        error: 'Failed to generate meeting prep document. Please try again.' 
      });
    }

    // Return the document as a downloadable text file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="meeting-prep-${customer.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'customer'}-${new Date().toISOString().split('T')[0]}.txt"`);
    
    return res.status(200).send(meetingPrepDocument);

  } catch (err) {
    console.error('Error generating customer meeting prep document:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

/**
 * GET /insights/:organizationId
 * Get insights for a specific organization
 */
router.get('/:organizationId', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  const { organizationId } = req.params;
  
  // Validate organization ID format
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({ 
      message: 'Invalid organization ID format',
      error: 'INVALID_ORGANIZATION_ID'
    });
  }

  try {
    // Fetch insights for the organization, sorted by most recent
    const insights = await InsightModel.find({ 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    })
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
    
    res.status(200).json({
      success: true,
      data: formattedInsights,
      count: formattedInsights.length
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      message: 'Error fetching insights',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /insights/:organizationId/summary
 * Get summary statistics for insights of a specific organization
 */
router.get('/:organizationId/summary', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  const { organizationId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    return res.status(400).json({ 
      message: 'Invalid organization ID format',
      error: 'INVALID_ORGANIZATION_ID'
    });
  }

  try {
    const orgObjectId = new mongoose.Types.ObjectId(organizationId);
    
    // Get aggregated statistics
    const stats = await InsightModel.aggregate([
      { $match: { organizationId: orgObjectId } },
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

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching insights summary:', error);
    res.status(500).json({ 
      message: 'Error fetching insights summary',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /insights
 * Get insights for all organizations (admin endpoint)
 */
router.get('/', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    
    const insights = await InsightModel.find({})
      .sort({ lastUpdatedAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
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

    res.status(200).json({
      success: true,
      data: formattedInsights,
      count: formattedInsights.length
    });
  } catch (error) {
    console.error('Error fetching all insights:', error);
    res.status(500).json({ 
      message: 'Error fetching insights',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

export default router;