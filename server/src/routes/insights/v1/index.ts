import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { QdrantAnalyticsService } from '../../../services/insights/qdrantAnalytics.service';
import { InsightModel } from '../../../schemas/insight.schema';
import dashboardSettingsService from '../../../services/organizations/dashboard-settings.service';
import { setUserContext } from '../../../context/userContext';
import dashboardRouter from './dashboard';
import schedulerRouter from './scheduler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Apply user context middleware to all routes
router.use(setUserContext);

// Include dashboard routes
router.use('/dashboard', dashboardRouter);

// Include scheduler routes
router.use('/scheduler', schedulerRouter);

/**
 * @route POST /api/v1/insights
 * @desc Create a new insight
 * @access Private
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization;
    const insightData = {
      ...req.body,
      organization: organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insight = new InsightModel(insightData);
    const savedInsight = await insight.save();

    res.status(201).json({
      success: true,
      data: savedInsight
    });

  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create insight',
      message: (error as Error).message
    });
  }
});

/**
 * @route DELETE /api/v1/insights/:id
 * @desc Delete an insight by ID
 * @access Private
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organization;

    const insight = await InsightModel.findOneAndDelete({ 
      _id: id,
      organization: organizationId 
    });

    if (!insight) {
      res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting insight:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete insight',
      message: (error as Error).message
    });
  }
});

/**
 * @route PATCH /api/v1/insights/:id
 * @desc Update an insight by ID
 * @access Private
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organization;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const insight = await InsightModel.findOneAndUpdate(
      { _id: id, organization: organizationId },
      updateData,
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
    console.error('Error updating insight:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update insight',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/analytics
 * @desc Get comprehensive analytics for an organization
 * @access Private
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization;
    const { startDate, endDate, useOrganizationSettings = 'true' } = req.query;

    let timeRange: { start: string; end: string } | undefined;

    // Use organization dashboard settings if requested
    if (useOrganizationSettings === 'true') {
      const dashboardSettings = await dashboardSettingsService.getDashboardSettings(organizationId.toString());
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      const settings = dashboardSettings || defaultSettings;
      
      const calculatedTimeRange = dashboardSettingsService.calculateTimeRange(settings);
      timeRange = calculatedTimeRange || undefined;
      console.log(`🔍 Using organization settings for analytics:`, timeRange ? `${timeRange.start} to ${timeRange.end}` : 'all time');
    } else {
      // Use query parameters if provided
      timeRange = startDate && endDate ? {
        start: startDate as string,
        end: endDate as string
      } : undefined;
    }

    const analyticsService = new QdrantAnalyticsService();
    const analytics = await analyticsService.generateAnalytics(timeRange);

    res.status(200).json({
      success: true,
      data: analytics,
      timeRange: timeRange || 'all_time'
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
    const { 
      timeRange, 
      includeTrends = true, 
      includeAnomalies = true, 
      includeTopIssues = true 
    } = req.body;

    const analyticsService = new QdrantAnalyticsService();
    const result = await analyticsService.generateInsights({
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
    const organizationId = req.user!.organization;
    const { 
      category, 
      severity, 
      status = 'active',
      limit = 50, 
      offset = 0 
    } = req.query;

    // Use organization + status index for base query
    const baseFilter: { organization: any; status?: string } = {
      organization: organizationId
    };
    
    if (status) baseFilter.status = status as string;

    // Get insights using the organization + status index
    let insights = await InsightModel.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 2) // Get more to account for filtering
      .skip(Number(offset));

    // Apply additional filters in JavaScript
    if (category) {
      insights = insights.filter(insight => insight.category === category);
    }
    if (severity) {
      insights = insights.filter(insight => insight.severity === severity);
    }

    // Apply limit after filtering
    insights = insights.slice(0, Number(limit));

    // Get total count with same filtering logic
    const allInsights = await InsightModel.find(baseFilter);
    let filteredInsights = allInsights;
    if (category) {
      filteredInsights = filteredInsights.filter(insight => insight.category === category);
    }
    if (severity) {
      filteredInsights = filteredInsights.filter(insight => insight.severity === severity);
    }
    const total = filteredInsights.length;

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
    const organizationId = req.user!.organization;
    const insight = await InsightModel.findOne({ _id: id, organization: organizationId });

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
    const organizationId = req.user!.organization;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Use organization + createdAt index for base query
    const insights = await InsightModel.find({
      organization: organizationId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate summary in JavaScript
    const summary = {
      totalInsights: insights.length,
      byCategory: insights.reduce((acc: Record<string, number>, insight) => {
        acc[insight.category] = (acc[insight.category] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: insights.reduce((acc: Record<string, number>, insight) => {
        acc[insight.severity] = (acc[insight.severity] || 0) + 1;
        return acc;
      }, {}),
      byStatus: insights.reduce((acc: Record<string, number>, insight) => {
        acc[insight.status] = (acc[insight.status] || 0) + 1;
        return acc;
      }, {}),
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
    const organizationId = req.user!.organization;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Use organization + createdAt index for base query
    const insights = await InsightModel.find({
      organization: organizationId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Group insights by day in JavaScript
    const insightsByDay: Record<string, any[]> = {};
    
    insights.forEach(insight => {
      const date = insight.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!insightsByDay[date]) {
        insightsByDay[date] = [];
      }
      insightsByDay[date].push(insight);
    });

    // Calculate trends
    const trendData = Object.keys(insightsByDay).sort().map(date => {
      const dayInsights = insightsByDay[date];
      const categories = dayInsights.map(i => i.category);
      const severities = dayInsights.map(i => i.severity);
      
      return {
        date,
        totalInsights: dayInsights.length,
        categoryBreakdown: categories.reduce((acc: Record<string, number>, cat: string) => {
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}),
        severityBreakdown: severities.reduce((acc: Record<string, number>, sev: string) => {
          acc[sev] = (acc[sev] || 0) + 1;
          return acc;
        }, {})
      };
    });

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