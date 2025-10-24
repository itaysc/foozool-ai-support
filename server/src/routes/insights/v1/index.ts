import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { 
  getInsightsByOrganization,
  getInsightsSummary,
  getAllInsights,
  getCustomerSuccessInsights,
  getAllCustomerSuccessInsights,
  generateCustomerMeetingPrep,
  updateInsightAssignee,
  updateInsightStatus,
  getAllUnifiedInsights
} from '../../../services/insights';

// Import comment routes
import commentsRouter from './comments';

const router = express.Router();

/**
 * GET /insights/customer-success/:customerId
 * Generate Customer Success risk insights for a specific customer (authenticated, org-scoped)
 * Place BEFORE dynamic /insights/:organizationId to avoid route conflicts.
 */
router.get('/customer-success/:customerId', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await getCustomerSuccessInsights(customerId);
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('Error generating CS insights:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});
/**
 * GET /insights/customer-success
 * Generate Customer Success risk insights for ALL customers in the current organization (authenticated, org-scoped)
 */
router.get('/customer-success', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const result = await getAllCustomerSuccessInsights();
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('Error generating CS insights for all customers:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

/**
 * POST /insights/customer-meeting-prep/:customerId
 * Generate a comprehensive customer meeting prep document for a specific customer
 */
router.post('/customer-meeting-prep/:customerId', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const { forceRegenerate } = req.body;
    
    const { pdfDoc, filename } = await generateCustomerMeetingPrep(customerId, forceRegenerate);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe the PDF to the response
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err: any) {
    console.error('Error generating customer meeting prep document:', err);
    const status = err.message === 'Customer not found' ? 404 : 
                   err.message === 'Organization ID not found in user context' ? 400 :
                   err.message === 'User ID is required for LLM operations' ? 400 : 500;
    return res.status(status).json({ status, error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /insights/customer-meeting-prep/:customerId/cache
 * Invalidate cached meeting prep document for a specific customer
 */
router.delete('/customer-meeting-prep/:customerId/cache', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const organizationId = req.user!.organization;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    const { MeetingPrepCacheService } = await import('../../../services/cache/meetingPrepCache.service');
    const cacheService = MeetingPrepCacheService.getInstance();
    
    await cacheService.invalidateCache(organizationId.toString(), customerId);
    
    res.json({ 
      success: true, 
      message: `Cache invalidated for customer ${customerId}` 
    });

  } catch (err: any) {
    console.error('Error invalidating meeting prep cache:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /insights/customer-meeting-prep/cache/stats
 * Get cache statistics for meeting prep documents
 */
router.get('/customer-meeting-prep/cache/stats', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const organizationId = req.user!.organization;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    const { MeetingPrepCacheService } = await import('../../../services/cache/meetingPrepCache.service');
    const cacheService = MeetingPrepCacheService.getInstance();
    
    const stats = await cacheService.getCacheStats(organizationId.toString());
    
    res.json({ 
      success: true, 
      stats 
    });

  } catch (err: any) {
    console.error('Error getting cache stats:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /insights/customer-meeting-prep/:customerId/cache/metadata
 * Get cache metadata for a specific customer's meeting prep document
 */
router.get('/customer-meeting-prep/:customerId/cache/metadata', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const organizationId = req.user!.organization;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    const { MeetingPrepCacheService } = await import('../../../services/cache/meetingPrepCache.service');
    const cacheService = MeetingPrepCacheService.getInstance();
    
    const metadata = await cacheService.getCacheMetadata(organizationId.toString(), customerId);
    
    if (!metadata) {
      return res.status(404).json({ 
        success: false, 
        message: 'No cached document found for this customer' 
      });
    }
    
    res.json({ 
      success: true, 
      metadata 
    });

  } catch (err: any) {
    console.error('Error getting cache metadata:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /insights/customer-meeting-prep/cache/invalidate
 * Manually trigger cache invalidation for meeting prep documents
 */
router.post('/customer-meeting-prep/cache/invalidate', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const organizationId = req.user!.organization;
    const { customerId, reason } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    const { CacheInvalidationService } = await import('../../../services/cache/cacheInvalidation.service');
    const cacheInvalidationService = CacheInvalidationService.getInstance();
    
    if (customerId) {
      // Invalidate specific customer cache
      await cacheInvalidationService.invalidateCustomerCache(
        organizationId.toString(), 
        customerId, 
        reason || 'Manual invalidation'
      );
      
      res.json({ 
        success: true, 
        message: `Cache invalidated for customer ${customerId}`,
        invalidatedCustomer: customerId
      });
    } else {
      // Invalidate all caches for the organization
      await cacheInvalidationService.invalidateOrganizationCache(
        organizationId.toString(), 
        reason || 'Manual organization-wide invalidation'
      );
      
      res.json({ 
        success: true, 
        message: `All caches invalidated for organization ${organizationId}`,
        invalidatedOrganization: organizationId
      });
    }

  } catch (err: any) {
    console.error('Error invalidating meeting prep cache:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /insights/customer-meeting-prep/cache/cleanup
 * Manually trigger cache cleanup (remove expired caches)
 */
router.post('/customer-meeting-prep/cache/cleanup', authenticateJWT, hasPermission('insights:meeting-prep'), async (req, res) => {
  try {
    const organizationId = req.user!.organization;
    
    if (!organizationId) {
      return res.status(400).json({ error: "Missing organizationId" });
    }

    const { CacheCleanupJob } = await import('../../../jobs/cache-cleanup.job');
    const cacheCleanupJob = CacheCleanupJob.getInstance();
    
    await cacheCleanupJob.runCleanupNow();
    
    res.json({ 
      success: true, 
      message: 'Cache cleanup completed successfully'
    });

  } catch (err: any) {
    console.error('Error running cache cleanup:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * PATCH /insights/:insightId/assignee
 * Update the assignee for a specific insight
 */
router.patch('/:insightId/assignee', authenticateJWT, hasPermission('insights:write'), async (req, res) => {
  try {
    const { insightId } = req.params;
    const { assignee } = req.body;
    
    // Validate insightId format
    if (!insightId || !/^[0-9a-fA-F]{24}$/.test(insightId)) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Invalid insight ID format' 
      });
    }
    
    // Validate assignee format if provided (should be a valid ObjectId or null/undefined)
    if (assignee && !/^[0-9a-fA-F]{24}$/.test(assignee)) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Invalid assignee ID format' 
      });
    }
    
    const result = await updateInsightAssignee(insightId, assignee);
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('Error updating insight assignee:', err);
    const status = err.message === 'Insight not found' ? 404 : 
                   err.message === 'Organization ID not found in user context' ? 400 : 500;
    return res.status(status).json({ status, error: err.message || 'Internal server error' });
  }
});

/**
 * PATCH /insights/:insightId/status
 * Update the status for a specific insight
 */
router.patch('/:insightId/status', authenticateJWT, hasPermission('insights:write'), async (req, res) => {
  try {
    const { insightId } = req.params;
    const { status } = req.body;
    
    // Validate insightId format
    if (!insightId || !/^[0-9a-fA-F]{24}$/.test(insightId)) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Invalid insight ID format' 
      });
    }
    
    // Validate status
    if (!status) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Status is required' 
      });
    }
    
    const validStatuses = ['new', 'in_progress', 'resolved', 'closed', 'reopened'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        status: 400, 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }
    
    const result = await updateInsightStatus(insightId, status);
    return res.status(result.status).json(result);
  } catch (err: any) {
    console.error('Error updating insight status:', err);
    const status = err.message === 'Insight not found' ? 404 : 
                   err.message === 'Organization ID not found in user context' ? 400 : 500;
    return res.status(status).json({ status, error: err.message || 'Internal server error' });
  }
});

/**
 * GET /insights
 * Get insights for the current organization
 */
router.get('/', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const dateFilter = fromDate || toDate ? { fromDate: fromDate as string, toDate: toDate as string } : undefined;
    const result = await getInsightsByOrganization(dateFilter);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    const status = error.message === 'INVALID_ORGANIZATION_ID' ? 400 : 500;
    res.status(status).json({ 
      message: status === 400 ? 'Invalid organization ID format' : 'Error fetching insights',
      error: status === 400 ? 'INVALID_ORGANIZATION_ID' : 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /insights/unified
 * Get all insights (NPS, CSAT, and Customer Success) for the current organization
 */
router.get('/unified', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await getAllUnifiedInsights(customerId as string | undefined);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching unified insights:', error);
    res.status(500).json({ 
      message: 'Error fetching unified insights',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /insights/summary
 * Get summary statistics for insights of the current organization
 */
router.get('/summary', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const dateFilter = fromDate || toDate ? { fromDate: fromDate as string, toDate: toDate as string } : undefined;
    const result = await getInsightsSummary(dateFilter);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching insights summary:', error);
    const status = error.message === 'INVALID_ORGANIZATION_ID' ? 400 : 500;
    res.status(status).json({ 
      message: status === 400 ? 'Invalid organization ID format' : 'Error fetching insights summary',
      error: status === 400 ? 'INVALID_ORGANIZATION_ID' : 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /insights
 * Get insights for all organizations (admin endpoint)
 */
router.get('/', authenticateJWT, hasPermission('insights:read'), async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const result = await getAllInsights(parseInt(limit as string), parseInt(skip as string));
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching all insights:', error);
    res.status(500).json({ 
      message: 'Error fetching insights',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Mount comment routes before dataIntelligence routes
router.use('/', commentsRouter);

// Import and use the new data intelligence routes
import dataIntelligenceRoutes from './dataIntelligence';
router.use('/', dataIntelligenceRoutes);

export default router;