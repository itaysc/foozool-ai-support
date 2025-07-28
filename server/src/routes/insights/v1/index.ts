import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { QdrantAnalyticsService } from '../../../services/insights/qdrantAnalytics.service';
import { InsightModel } from '../../../schemas/insight.schema';
import dashboardRouter from './dashboard';
import schedulerRouter from './scheduler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Include dashboard routes
router.use('/dashboard', dashboardRouter);

// Include scheduler routes
router.use('/scheduler', schedulerRouter);

/**
 * @route GET /api/v1/insights/analytics
 * @desc Get comprehensive analytics for an organization
 * @access Private
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { startDate, endDate } = req.query;

    const timeRange = startDate && endDate ? {
      start: startDate as string,
      end: endDate as string
    } : undefined;

    const analyticsService = new QdrantAnalyticsService();
    const analytics = await analyticsService.generateAnalytics(organizationId, timeRange);

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate analytics',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/generate
 * @desc Generate AI-powered insights for an organization
 * @access Private
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { 
      timeRange, 
      includeTrends = true, 
      includeAnomalies = true, 
      includeTopIssues = true 
    } = req.body;

    const analyticsService = new QdrantAnalyticsService();
    const result = await analyticsService.generateInsights({
      organizationId,
      timeRange,
      includeTrends,
      includeAnomalies,
      includeTopIssues
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate insights',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights
 * @desc Get all insights for an organization
 * @access Private
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { 
      category, 
      severity, 
      status = 'active',
      limit = 50, 
      offset = 0 
    } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const insights = await InsightModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await InsightModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        insights,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: total > Number(offset) + insights.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch insights',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/:id
 * @desc Get a specific insight by ID
 * @access Private
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const insight = await InsightModel.findById(id);

    if (!insight) {
      res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: insight
    });

  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch insight',
      message: (error as Error).message
    });
  }
});

/**
 * @route PATCH /api/v1/insights/:id/status
 * @desc Update insight status
 * @access Private
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'resolved', 'archived'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: active, resolved, archived'
      });
      return;
    }

    const insight = await InsightModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!insight) {
      res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: insight
    });

  } catch (error) {
    console.error('Error updating insight status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update insight status',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/summary
 * @desc Get insights summary for an organization
 * @access Private
 */
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const insights = await InsightModel.find({
      createdAt: { $gte: startDate }
    });

    const summary = {
      totalInsights: insights.length,
      byCategory: insights.reduce((acc, insight) => {
        acc[insight.category] = (acc[insight.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: insights.reduce((acc, insight) => {
        acc[insight.severity] = (acc[insight.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: insights.reduce((acc, insight) => {
        acc[insight.status] = (acc[insight.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      highPriorityCount: insights.filter(i => i.severity === 'high' || i.severity === 'critical').length,
      averageConfidence: insights.length > 0 
        ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length 
        : 0
    };

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching insights summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch insights summary',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/trends
 * @desc Get trend analysis for insights
 * @access Private
 */
router.get('/trends', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get insights grouped by day
    const insights = await InsightModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          categories: { $push: "$category" },
          severities: { $push: "$severity" }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    // Calculate trends
    const trendData = insights.map(day => ({
      date: day._id,
      totalInsights: day.count,
      categoryBreakdown: day.categories.reduce((acc: any, cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
      severityBreakdown: day.severities.reduce((acc: any, sev: string) => {
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {})
    }));

    res.status(200).json({
      success: true,
      data: {
        trendData,
        timeRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching insights trends:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch insights trends',
      message: (error as Error).message
    });
  }
});

export default router; 