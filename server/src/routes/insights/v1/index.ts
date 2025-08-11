import express from 'express';
import { InsightModel } from '../../../schemas/insights.schema';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /insights/:organizationId
 * Get insights for a specific organization
 */
router.get('/insights/:organizationId', async (req, res) => {
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
router.get('/insights/:organizationId/summary', async (req, res) => {
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
router.get('/insights', async (req, res) => {
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