import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { BotMetricsService } from '../../../services/botPerformance/metrics.service';
import { BotPerformanceTracker } from '../../../services/botPerformance/tracking.service';
import { BotAnalyticsService } from '../../../services/botPerformance/analytics.service';
import { BotPerformanceCacheService } from '../../../services/botPerformance/cache.service';
import { ActionableInsightsService } from '../../../services/botPerformance/actionableInsights.service';

const router = express.Router();

/**
 * @route GET /api/v1/bot-performance/dashboard
 * @desc Get bot performance dashboard data
 * @access Private
 */
router.get('/dashboard', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const days = parseInt(req.query.days as string) || 30;
    const useCache = req.query.useCache !== 'false'; // Default to true unless explicitly false

    const cacheParams = { days };
    
    // Try to get from cache first (only if useCache is true)
    if (useCache) {
      const cachedData = await BotPerformanceCacheService.get('dashboard', organizationId, cacheParams);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }
    }

    const dashboardData = await BotMetricsService.getDashboardData(organizationId, days);

    // Cache the result (only if useCache is true)
    if (useCache) {
      await BotPerformanceCacheService.set('dashboard', organizationId, dashboardData, cacheParams);
    }

    res.json({
      success: true,
      data: dashboardData,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching bot performance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bot performance data',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/insights
 * @desc Get actionable insights based on bot performance
 * @access Private
 */
router.get('/insights', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();

    const insights = await BotMetricsService.getActionableInsights(organizationId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching bot performance insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bot insights',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/summary
 * @desc Get bot performance summary for a date range
 * @access Private
 */
router.get('/summary', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const cacheParams = { 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0] 
    };
    
    // Try to get from cache first
    const cachedData = await BotPerformanceCacheService.get('summary', organizationId, cacheParams);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        fromCache: true
      });
    }

    const summary = await BotPerformanceTracker.getPerformanceSummary(
      organizationId,
      startDate,
      endDate
    );

    // Cache the result
    await BotPerformanceCacheService.set('summary', organizationId, summary, cacheParams);

    res.json({
      success: true,
      data: summary,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching bot performance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance summary',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/bot-performance/calculate-metrics
 * @desc Manually trigger daily metrics calculation
 * @access Private
 */
router.post('/calculate-metrics', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const date = req.body.date ? new Date(req.body.date) : new Date();

    await BotPerformanceTracker.calculateDailyMetrics(organizationId, date);

    // Invalidate cache after metrics update
    await BotPerformanceCacheService.invalidateAfterMetricsUpdate(organizationId);

    res.json({
      success: true,
      data: {
        message: 'Daily metrics calculated successfully',
        date: date.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error calculating bot metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate metrics',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/bot-performance/calculate-all
 * @desc Calculate metrics for all organizations (admin only)
 * @access Private
 */
router.post('/calculate-all', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    const date = req.body.date ? new Date(req.body.date) : new Date();

    await BotMetricsService.calculateAllOrganizationsMetrics(date);

    res.json({
      success: true,
      data: {
        message: 'Metrics calculated for all organizations',
        date: date.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error calculating metrics for all organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate metrics for all organizations',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/kpis
 * @desc Get key performance indicators for bot
 * @access Private
 */
router.get('/kpis', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const days = parseInt(req.query.days as string) || 7;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const summary = await BotPerformanceTracker.getPerformanceSummary(
      organizationId,
      startDate,
      endDate
    );

    const kpis = {
      ticketsProcessed: {
        value: summary.totalTickets,
        label: 'Tickets Processed',
        trend: 'stable', // TODO: Calculate trend
        description: `In the last ${days} days`
      },
      successRate: {
        value: summary.avgSuccessRate,
        label: 'Success Rate',
        trend: 'stable',
        description: 'Percentage of tickets resolved by bot',
        format: 'percentage'
      },
      avgResponseTime: {
        value: summary.avgResponseTime,
        label: 'Avg Response Time',
        trend: 'stable',
        description: 'Average time to generate response',
        format: 'milliseconds'
      },
      costSavings: {
        value: summary.totalCostSavings,
        label: 'Cost Savings',
        trend: 'increasing',
        description: 'Estimated cost savings from automation',
        format: 'currency'
      },
      customerSatisfaction: {
        value: summary.avgCustomerSatisfaction,
        label: 'Customer Satisfaction',
        trend: 'stable',
        description: 'Average rating of bot responses',
        format: 'rating'
      }
    };

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error fetching bot KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bot KPIs',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/analytics
 * @desc Get comprehensive performance analytics with patterns and predictions
 * @access Private
 */
router.get('/analytics', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const days = parseInt(req.query.days as string) || 30;
    const useCache = req.query.useCache !== 'false'; // Default to true unless explicitly false

    const cacheParams = { days };
    
    // Try to get from cache first (only if useCache is true)
    if (useCache) {
      const cachedData = await BotPerformanceCacheService.get('analytics', organizationId, cacheParams);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }
    }

    const analytics = await BotAnalyticsService.generateAnalytics(organizationId, days);

    // Cache the result (only if useCache is true)
    if (useCache) {
      await BotPerformanceCacheService.set('analytics', organizationId, analytics, cacheParams);
    }

    res.json({
      success: true,
      data: analytics,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching bot performance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/benchmarks
 * @desc Get performance comparison with industry benchmarks
 * @access Private
 */
router.get('/benchmarks', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const useCache = req.query.useCache !== 'false'; // Default to true unless explicitly false

    // Try to get from cache first (only if useCache is true)
    if (useCache) {
      const cachedData = await BotPerformanceCacheService.get('benchmarks', organizationId);
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }
    }

    const benchmarks = await BotAnalyticsService.getBenchmarkComparison(organizationId);

    // Cache the result (only if useCache is true)
    if (useCache) {
      await BotPerformanceCacheService.set('benchmarks', organizationId, benchmarks);
    }

    res.json({
      success: true,
      data: benchmarks,
      fromCache: false
    });
  } catch (error) {
    console.error('Error fetching benchmark comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmarks',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/trends
 * @desc Get detailed trend analysis and forecasting
 * @access Private
 */
router.get('/trends', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const metric = req.query.metric as string || 'successRate';
    const days = parseInt(req.query.days as string) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const summary = await BotPerformanceTracker.getPerformanceSummary(
      organizationId,
      startDate,
      endDate
    );

    // Format trend data for charts
    const trendData = summary.dailyMetrics?.map(m => ({
      date: m.date.toISOString().split('T')[0],
      value: metric === 'successRate' ? m.successRate :
             metric === 'responseTime' ? m.avgResponseTime :
             metric === 'volume' ? m.totalTicketsProcessed :
             metric === 'satisfaction' ? m.customerSatisfactionImpact :
             m.successRate
    })) || [];

    res.json({
      success: true,
      data: {
        metric,
        period: `${days} days`,
        trends: trendData,
        summary: {
          average: trendData.length > 0 
            ? Math.round((trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length) * 10) / 10
            : 0,
          change: trendData.length >= 2
            ? Math.round((trendData[trendData.length - 1].value - trendData[0].value) * 10) / 10
            : 0,
          direction: trendData.length >= 2
            ? trendData[trendData.length - 1].value > trendData[0].value ? 'increasing' : 'decreasing'
            : 'stable'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/bot-performance/cache/clear
 * @desc Clear cache for an organization or all cache
 * @access Private
 */
router.post('/cache/clear', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user!.organization.toString();
    const { scope } = req.body; // 'organization' or 'all'
    
    if (scope === 'all') {
      // Only allow clearing all cache for admin users (you might want to add admin check)
      await BotPerformanceCacheService.clearAllCache();
      console.log(`🗑️ All bot performance cache cleared by user from org ${organizationId}`);
    } else {
      // Clear cache for current organization
      await BotPerformanceCacheService.clearOrganizationCache(organizationId);
      console.log(`🗑️ Cache cleared for organization ${organizationId}`);
    }

    res.json({
      success: true,
      data: {
        message: `Cache cleared successfully (scope: ${scope || 'organization'})`,
        scope: scope || 'organization'
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/cache/stats
 * @desc Get cache statistics
 * @access Private
 */
router.get('/cache/stats', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const stats = await BotPerformanceCacheService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache stats',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/bot-performance/enhanced-insights
 * @desc Get enhanced actionable insights with step-by-step plans
 * @access Private
 */
router.get('/enhanced-insights', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organization?.toString();
    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Organization not found'
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const useCache = req.query.useCache !== 'false'; // Default to true unless explicitly false
    
    // Check cache first (only if useCache is true)
    if (useCache) {
      const cachedData = await BotPerformanceCacheService.get('enhanced-insights', organizationId, { days });
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          cached: true
        });
      }
    }

    // Generate enhanced insights
    const insights = await ActionableInsightsService.generateEnhancedInsights(organizationId, days);
    
    // Cache for 4 hours (only if useCache is true)
    if (useCache) {
      await BotPerformanceCacheService.set('enhanced-insights', organizationId, insights, { days }, 4 * 60 * 60);
    }

    res.json({
      success: true,
      data: insights,
      cached: false
    });
  } catch (error) {
    console.error('Error generating enhanced insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced insights',
      message: (error as Error).message
    });
  }
});

export default router;