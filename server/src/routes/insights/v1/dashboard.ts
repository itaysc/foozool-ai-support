import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { DashboardService } from '../../../services/insights/dashboard.service';
import dashboardSettingsTestRouter from './dashboard-settings-test';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Include test routes
router.use('/', dashboardSettingsTestRouter);

/**
 * @route GET /api/v1/insights/dashboard/debug
 * @desc Debug endpoint to check organization data
 * @access Private
 */
router.get('/debug', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    
    const dashboardService = new DashboardService();
    const debugData = await dashboardService.debugOrganizationData(organizationId);

    res.status(200).json({
      success: true,
      data: debugData
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get debug data',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/debug-tickets
 * @desc Debug endpoint to check ticket counts and time ranges
 * @access Private
 */
router.get('/debug-tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end } = req.query;
    
    const dashboardService = new DashboardService();
    const analyticsService = dashboardService['analyticsService'];
    
    // Get total tickets for organization
    const allTickets = await analyticsService['getAllTicketsForOrganization']();
    
    // Get recent tickets (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTickets = await analyticsService['getAllTicketsForOrganization']({
      start: sevenDaysAgo.toISOString(),
      end: new Date().toISOString()
    });
    
    // Get tickets for custom time range if provided
    let customRangeTickets: any[] | null = null;
    if (start && end) {
      customRangeTickets = await analyticsService['getAllTicketsForOrganization']({
        start: start as string,
        end: end as string
      });
    }
    
    // Sample some tickets to check their created_at dates
    const sampleTickets = allTickets.slice(0, 5).map(ticket => ({
      id: ticket.id,
      created_at: ticket.payload?.created_at,
      organization: ticket.payload?.organization,
      subject: ticket.payload?.subject?.substring(0, 50) + '...'
    }));

    const debugData = {
      totalTickets: allTickets.length,
      recentTickets: recentTickets.length,
      customRangeTickets: customRangeTickets ? customRangeTickets.length : null,
      customRange: start && end ? { start, end } : null,
      sampleTickets,
      timeRanges: {
        sevenDaysAgo: sevenDaysAgo.toISOString(),
        now: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      data: debugData
    });

  } catch (error) {
    console.error('Error in debug tickets endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get debug tickets data',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/debug-qdrant
 * @desc Debug endpoint to check Qdrant data directly
 * @access Private
 */
router.get('/debug-qdrant', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { start, end } = req.query;
    
    const dashboardService = new DashboardService();
    const analyticsService = dashboardService['analyticsService'];
    
    // Get raw Qdrant data
    const tickets = await analyticsService['getAllTicketsForOrganization']({
      start: start as string,
      end: end as string
    });
    
    // Calculate intent distribution manually
    const intentCounts = tickets.reduce((acc, ticket) => {
      const intent = ticket.payload?.intent || 'unknown';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sample tickets
    const sampleTickets = tickets.slice(0, 5).map(ticket => ({
      id: ticket.id,
      intent: ticket.payload?.intent,
      subject: ticket.payload?.subject?.substring(0, 100),
      organization: ticket.payload?.organization,
      created_at: ticket.payload?.created_at
    }));

    const debugData = {
      totalTickets: tickets.length,
      intentDistribution: intentCounts,
      sampleTickets,
      timeRange: start && end ? { start, end } : 'all time'
    };

    res.status(200).json({
      success: true,
      data: debugData
    });

  } catch (error) {
    console.error('Error in debug Qdrant endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get debug Qdrant data',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/dashboard/clear-cache
 * @desc Clear dashboard cache for the organization
 * @access Private
 */
router.post('/clear-cache', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    
    const dashboardService = new DashboardService();
    await dashboardService.clearDashboardCache(organizationId);

    res.status(200).json({
      success: true,
      message: 'Dashboard cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear dashboard cache',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/metrics
 * @desc Get comprehensive dashboard metricsd
 * @access Private
 */
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { start, end } = req.query;
    
    // Parse time range from query parameters
    let timeRange: { start: string; end: string } | undefined;
    if (start && end) {
      timeRange = {
        start: start as string,
        end: end as string
      };
    }
    
    const dashboardService = new DashboardService();
    const metrics = await dashboardService.getDashboardMetrics(organizationId, timeRange);

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard metrics',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/insights
 * @desc Get AI-powered dashboard insights
 * @access Private
 */
router.get('/insights', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { start, end } = req.query;
    
    // Parse time range from query parameters
    let timeRange: { start: string; end: string } | undefined;
    if (start && end) {
      timeRange = {
        start: start as string,
        end: end as string
      };
    }
    
    const dashboardService = new DashboardService();
    const insights = await dashboardService.getDashboardInsights(organizationId, timeRange);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error fetching dashboard insights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard insights',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/alerts
 * @desc Get real-time alerts and notifications
 * @access Private
 */
router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { start, end } = req.query;
    
    // Parse time range from query parameters
    let timeRange: { start: string; end: string } | undefined;
    if (start && end) {
      timeRange = {
        start: start as string,
        end: end as string
      };
    }
    
    const dashboardService = new DashboardService();
    const alerts = await dashboardService.getAlerts(organizationId, timeRange);

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch alerts',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/performance
 * @desc Get performance comparison with previous periods
 * @access Private
 */
router.get('/performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const dashboardService = new DashboardService();
    const performance = await dashboardService.getPerformanceComparison(organizationId);

    res.status(200).json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Error fetching performance comparison:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch performance comparison',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/insights/dashboard/timeseries
 * @desc Get time-series data for charts
 * @access Private
 */
router.get('/timeseries', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { start, end } = req.query;
    
    // Parse time range from query parameters
    let timeRange: { start: string; end: string } | undefined;
    if (start && end) {
      timeRange = {
        start: start as string,
        end: end as string
      };
    }
    
    const dashboardService = new DashboardService();
    const timeSeriesData = await dashboardService.getTimeSeriesData(organizationId, timeRange);

    res.status(200).json({
      success: true,
      data: timeSeriesData
    });

  } catch (error) {
    console.error('Error fetching time-series data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch time-series data',
      message: (error as Error).message
    });
  }
});

export default router; 