import express from 'express';
import { InsightModel } from '../../../schemas/insights.schema';
import mongoose from 'mongoose';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { generateCustomerSuccessInsights } from '../../../services/insights/customerSuccess.service';
import { CustomerModel } from '../../../schemas';

const router = express.Router();

/**
 * GET /insights/customer-success/:customerId
 * Generate Customer Success risk insights for a specific customer (authenticated, org-scoped)
 * Place BEFORE dynamic /insights/:organizationId to avoid route conflicts.
 */
router.get('/customer-success/:customerId', authenticateJWT, async (req, res) => {
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
router.get('/customer-success', authenticateJWT, async (req, res) => {
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
 * GET /insights/:organizationId
 * Get insights for a specific organization
 */
router.get('/:organizationId', async (req, res) => {
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
router.get('/:organizationId/summary', async (req, res) => {
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
router.get('/', async (req, res) => {
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