import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { DashboardService } from '../../../services/insights/dashboard.service';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v1/insights/dashboard/metrics
 * @desc Get comprehensive dashboard metrics
 * @access Private
 */
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const dashboardService = new DashboardService();
    const metrics = await dashboardService.getDashboardMetrics(organizationId);

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
    const dashboardService = new DashboardService();
    const insights = await dashboardService.getDashboardInsights(organizationId);

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
    const dashboardService = new DashboardService();
    const alerts = await dashboardService.getAlerts(organizationId);

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

export default router; 