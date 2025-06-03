import { Router } from 'express';
import { dashboardService } from '../services/dashboard';
import { authenticateJWT } from '../middleware/authenticate';

const router = Router();

/**
 * GET /api/insights-dashboard/overview
 * Get dashboard overview with key metrics and recent insights
 */
router.get('/overview', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getOverviewMetrics({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard overview' });
  }
});

/**
 * GET /api/insights-dashboard/customer-behavior
 * Get customer behavior analytics and insights
 */
router.get('/customer-behavior', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getCustomerBehaviorAnalytics({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Customer behavior analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to load customer behavior analytics' });
  }
});

/**
 * GET /api/insights-dashboard/operational-intelligence
 * Get operational intelligence metrics
 */
router.get('/operational-intelligence', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getOperationalIntelligence({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Operational intelligence error:', error);
    res.status(500).json({ success: false, error: 'Failed to load operational intelligence' });
  }
});

/**
 * GET /api/insights-dashboard/business-intelligence
 * Get business intelligence insights
 */
router.get('/business-intelligence', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getBusinessIntelligence({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Business intelligence error:', error);
    res.status(500).json({ success: false, error: 'Failed to load business intelligence' });
  }
});

/**
 * GET /api/insights-dashboard/quality-insights
 * Get quality assurance insights
 */
router.get('/quality-insights', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getQualityInsights({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Quality insights error:', error);
    res.status(500).json({ success: false, error: 'Failed to load quality insights' });
  }
});

/**
 * GET /api/insights-dashboard/predictive-analytics
 * Get predictive analytics and forecasts
 */
router.get('/predictive-analytics', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30 } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getPredictiveAnalytics({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack)
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to load predictive analytics' });
  }
});

/**
 * GET /api/insights-dashboard/actionable-insights
 * Get prioritized actionable insights with recommendations
 */
router.get('/actionable-insights', authenticateJWT, async (req, res) => {
  try {
    const { productId, daysBack = 30, priority = 'all' } = req.query;
    const organization = req.user?.organization?.toString();
    
    if (!organization) {
      res.status(400).json({ 
        success: false, 
        error: 'Organization not found in user context' 
      });
      return;
    }
    
    const result = await dashboardService.getActionableInsights({
      organization,
      productId: productId as string,
      daysBack: Number(daysBack),
      priority: priority as string
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Actionable insights error:', error);
    res.status(500).json({ success: false, error: 'Failed to load actionable insights' });
  }
});

export default router; 