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
  updateInsightStatus
} from '../../../services/insights';

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
    const { pdfDoc, filename } = await generateCustomerMeetingPrep(customerId);
    
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

// Import and use the new data intelligence routes
import dataIntelligenceRoutes from './dataIntelligence';
router.use('/', dataIntelligenceRoutes);

export default router;