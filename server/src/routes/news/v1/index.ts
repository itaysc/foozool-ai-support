import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { newsService } from '../../../services/news';
import { hasPermission } from '../../../middleware/permissions';

const router = Router();

/**
 * GET /api/v1/news/:organizationId
 * Get raw news for an organization (without summarization)
 */
router.get(
  '/:organizationId',
  authenticateJWT,
  hasPermission('news:read'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      console.log(`📰 Fetching raw news for organization: ${organizationId}`);
      
      const news = await newsService.getRawNewsForOrganization(organizationId);
      
      res.json({
        success: true,
        data: {
          news,
          count: news.length,
          organizationId
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching news:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch news'
      });
    }
  }
);

/**
 * GET /api/v1/news/:organizationId/action-items
 * Get action items derived from news analysis
 */
router.get(
  '/:organizationId/action-items',
  authenticateJWT,
  hasPermission('news:read'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      console.log(`🎯 Fetching action items for organization: ${organizationId}`);
      
      const newsData = await newsService.getNewsForOrganization(organizationId);
      
      res.json({
        success: true,
        data: {
          actionItems: newsData.actionItems,
          count: newsData.actionItems.length,
          organizationId,
          rssUrl: newsData.rssUrl,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching action items:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch action items'
      });
    }
  }
);

/**
 * GET /api/v1/news/:organizationId/summary
 * Get news summary and analysis
 */
router.get(
  '/:organizationId/summary',
  authenticateJWT,
  hasPermission('news:read'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      console.log(`📊 Fetching news summary for organization: ${organizationId}`);
      
      const newsData = await newsService.getNewsForOrganization(organizationId);
      
      res.json({
        success: true,
        data: {
          summary: newsData.summary,
          newsCount: newsData.news.length,
          relevantNewsCount: newsData.news.filter(item => 
            item.relevance === 'high' || item.relevance === 'medium'
          ).length,
          organizationId,
          rssUrl: newsData.rssUrl,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching news summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch news summary'
      });
    }
  }
);

/**
 * GET /api/v1/news/:organizationId/full
 * Get complete news data including news, summary, and action items
 */
router.get(
  '/:organizationId/full',
  authenticateJWT,
  hasPermission('news:read'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      console.log(`📰 Fetching complete news data for organization: ${organizationId}`);
      
      const newsData = await newsService.getNewsForOrganization(organizationId);
      
      res.json({
        success: true,
        data: {
          ...newsData,
          organizationId,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching complete news data:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch news data'
      });
    }
  }
);

export default router; 