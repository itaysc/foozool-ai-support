import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import dashboardSettingsService from '../../../services/organizations/dashboard-settings.service';
import { QdrantAnalyticsService } from '../../../services/insights/qdrantAnalytics.service';

const router = Router();

/**
 * @route GET /api/v1/insights/dashboard/test-settings
 * @desc Test endpoint to verify dashboard settings are working
 * @access Private
 */
router.get('/test-settings', 
  authenticateJWT,
  async (req, res) => {
    try {
      const organizationId = req.user!.organization.toString();
      
      // Get current dashboard settings
      const settings = await dashboardSettingsService.getDashboardSettings(organizationId);
      const defaultSettings = dashboardSettingsService.getDefaultSettings();
      const currentSettings = settings || defaultSettings;
      
      // Calculate time range
      const timeRange = dashboardSettingsService.calculateTimeRange(currentSettings);
      
      // Test analytics generation
      const analyticsService = new QdrantAnalyticsService();
      const userId = req.user!._id.toString();
      const analytics = await analyticsService.generateAnalytics(organizationId, userId, timeRange || undefined);
      
      res.json({
        success: true,
        data: {
          organizationId,
          dashboardSettings: currentSettings,
          timeRange: timeRange || 'all_time',
          analytics: {
            totalTickets: analytics.totalTickets,
            timeRange: analytics.timeRange,
            sentimentDistribution: analytics.sentimentDistribution,
            intentCount: Object.keys(analytics.intentDistribution).length,
            tagCount: Object.keys(analytics.tagFrequency).length
          }
        },
        message: 'Dashboard settings test completed successfully'
      });
    } catch (error) {
      console.error('❌ Error testing dashboard settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test dashboard settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router; 