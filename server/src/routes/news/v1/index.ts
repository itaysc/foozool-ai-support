import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { z } from 'zod';
import { newsService } from '../../../services/news';

const router = Router();

// Validation schemas
const getNewsSchema = z.object({
  params: z.object({
    organizationId: z.string().min(1, 'Organization ID is required')
  })
});

const getActionItemsSchema = z.object({
  params: z.object({
    organizationId: z.string().min(1, 'Organization ID is required')
  })
});

/**
 * GET /api/v1/news/:organizationId
 * Get raw news for an organization (without summarization)
 */
router.get(
  '/:organizationId',
  authenticateJWT,
  validateRequest(getNewsSchema),
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
  validateRequest(getActionItemsSchema),
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
  validateRequest(getNewsSchema),
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
  validateRequest(getNewsSchema),
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