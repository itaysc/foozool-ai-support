import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { AutonomousAIControllerService } from '../../../services/autonomousAI/autonomousAIController.service';
import zendeskAnalysisRouter from './zendesk-analysis';
import thresholdMissesRouter from './threshold-misses';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Include Zendesk analysis routes (these use webhook authentication)
router.use('/', zendeskAnalysisRouter);

// Include threshold miss routes
router.use('/threshold-misses', thresholdMissesRouter);

/**
 * @route GET /api/v1/autonomous-ai/analyze/:ticketId
 * @desc Analyze a ticket and get AI recommendations
 * @access Private
 */
router.get('/analyze/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const analysis = await AutonomousAIControllerService.analyzeTicket({
      ticketId
    });
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    res.status(500).json({ error: 'Failed to analyze ticket', message: (error as Error).message });
  }
});

/**
 * @route POST /api/v1/autonomous-ai/execute-action
 * @desc Execute a recommended action
 * @access Private
 */
router.post('/execute-action', async (req, res) => {
  try {
    const { ticketId, actionType, thresholdId, confidenceScore, parameters } = req.body;

    const result = await AutonomousAIControllerService.executeAction({
      ticketId,
      actionType,
      thresholdId,
      confidenceScore,
      parameters
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({ error: 'Failed to execute action', message: (error as Error).message });
  }
});

// Action Threshold Routes
/**
 * @route GET /api/v1/autonomous-ai/thresholds
 * @desc Get all action thresholds for organization
 * @access Private
 */
router.get('/thresholds', async (req, res) => {
  try {
    const thresholds = await AutonomousAIControllerService.getThresholds();
    res.json({ success: true, data: thresholds });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ error: 'Failed to fetch thresholds', message: (error as Error).message });
  }
});

/**
 * @route POST /api/v1/autonomous-ai/thresholds
 * @desc Create a new action threshold
 * @access Private
 */
router.post('/thresholds', async (req, res) => {
  try {
    const threshold = await AutonomousAIControllerService.createThreshold({
      thresholdData: req.body
    });
    res.status(201).json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error creating threshold:', error);
    res.status(500).json({ error: 'Failed to create threshold', message: (error as Error).message });
  }
});

/**
 * @route PUT /api/v1/autonomous-ai/thresholds/:id
 * @desc Update an action threshold
 * @access Private
 */
router.put('/thresholds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const threshold = await AutonomousAIControllerService.updateThreshold({
      thresholdId: id,
      updateData: req.body
    });
    res.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error updating threshold:', error);
    res.status(500).json({ error: 'Failed to update threshold', message: (error as Error).message });
  }
});

/**
 * @route DELETE /api/v1/autonomous-ai/thresholds/:id
 * @desc Delete an action threshold
 * @access Private
 */
router.delete('/thresholds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AutonomousAIControllerService.deleteThreshold(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting threshold:', error);
    res.status(500).json({ error: 'Failed to delete threshold', message: (error as Error).message });
  }
});

/**
 * @route PATCH /api/v1/autonomous-ai/thresholds/:id/toggle
 * @desc Toggle threshold active status
 * @access Private
 */
router.patch('/thresholds/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const threshold = await AutonomousAIControllerService.toggleThresholdStatus(id);
    res.json({ success: true, data: threshold });
  } catch (error) {
    console.error('Error toggling threshold:', error);
    res.status(500).json({ error: 'Failed to toggle threshold', message: (error as Error).message });
  }
});

/**
 * @route PATCH /api/v1/autonomous-ai/thresholds/:id/threshold
 * @desc Update threshold value
 * @access Private
 */
router.patch('/thresholds/:id/threshold', async (req, res) => {
  try {
    const { id } = req.params;
    const { threshold } = req.body;
    
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid threshold value. Must be a number between 0 and 1.' 
      });
    }
    
    const updatedThreshold = await AutonomousAIControllerService.updateThresholdValue(id, threshold);
    res.json({ success: true, data: updatedThreshold });
  } catch (error) {
    console.error('Error updating threshold value:', error);
    res.status(500).json({ error: 'Failed to update threshold value', message: (error as Error).message });
  }
});

// Customer Tier Routes
/**
 * @route GET /api/v1/autonomous-ai/customer-tiers
 * @desc Get all customer tiers for organization
 * @access Private
 */
router.get('/customer-tiers', async (req, res) => {
  try {
    const tiers = await AutonomousAIControllerService.getCustomerTiers();
    res.json({ success: true, data: tiers });
  } catch (error) {
    console.error('Error fetching customer tiers:', error);
    res.status(500).json({ error: 'Failed to fetch customer tiers', message: (error as Error).message });
  }
});

/**
 * @route POST /api/v1/autonomous-ai/customer-tiers
 * @desc Create a new customer tier
 * @access Private
 */
router.post('/customer-tiers', async (req, res) => {
  try {
    const tier = await AutonomousAIControllerService.createCustomerTier({
      tierData: req.body
    });
    res.status(201).json({ success: true, data: tier });
  } catch (error) {
    console.error('Error creating customer tier:', error);
    res.status(500).json({ error: 'Failed to create customer tier', message: (error as Error).message });
  }
});

/**
 * @route PUT /api/v1/autonomous-ai/customer-tiers/:id
 * @desc Update a customer tier
 * @access Private
 */
router.put('/customer-tiers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tier = await AutonomousAIControllerService.updateCustomerTier({
      tierId: id,
      updateData: req.body
    });
    res.json({ success: true, data: tier });
  } catch (error) {
    console.error('Error updating customer tier:', error);
    res.status(500).json({ error: 'Failed to update customer tier', message: (error as Error).message });
  }
});

/**
 * @route DELETE /api/v1/autonomous-ai/customer-tiers/:id
 * @desc Delete a customer tier
 * @access Private
 */
router.delete('/customer-tiers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AutonomousAIControllerService.deleteCustomerTier(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting customer tier:', error);
    res.status(500).json({ error: 'Failed to delete customer tier', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/customer-tiers/:id
 * @desc Get customer tier by ID
 * @access Private
 */
router.get('/customer-tiers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tier = await AutonomousAIControllerService.getCustomerTierById(id);
    res.json({ success: true, data: tier });
  } catch (error) {
    console.error('Error fetching customer tier:', error);
    res.status(500).json({ error: 'Failed to fetch customer tier', message: (error as Error).message });
  }
});

// Action Log Routes
/**
 * @route GET /api/v1/autonomous-ai/action-logs
 * @desc Get action logs for organization
 * @access Private
 */
router.get('/action-logs', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await AutonomousAIControllerService.getActionLogs(
      Number(limit),
      Number(offset)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({ error: 'Failed to fetch action logs', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/ticket/:ticketId
 * @desc Get action logs for a specific ticket
 * @access Private
 */
router.get('/action-logs/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { limit = 20 } = req.query;
    const logs = await AutonomousAIControllerService.getTicketActionLogs(ticketId, Number(limit));
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching ticket action logs:', error);
    res.status(500).json({ error: 'Failed to fetch ticket action logs', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/type/:actionType
 * @desc Get action logs by action type
 * @access Private
 */
router.get('/action-logs/type/:actionType', async (req, res) => {
  try {
    const { actionType } = req.params;
    const { limit = 50 } = req.query;
    const logs = await AutonomousAIControllerService.getActionLogsByType(
      actionType,
      Number(limit)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching action logs by type:', error);
    res.status(500).json({ error: 'Failed to fetch action logs by type', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/status/:status
 * @desc Get action logs by status
 * @access Private
 */
router.get('/action-logs/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;
    const logs = await AutonomousAIControllerService.getActionLogsByStatus(
      status,
      Number(limit)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching action logs by status:', error);
    res.status(500).json({ error: 'Failed to fetch action logs by status', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/failed
 * @desc Get failed actions for review
 * @access Private
 */
router.get('/action-logs/failed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = await AutonomousAIControllerService.getFailedActions(Number(limit));
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching failed actions:', error);
    res.status(500).json({ error: 'Failed to fetch failed actions', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/high-confidence
 * @desc Get high-confidence actions
 * @access Private
 */
router.get('/action-logs/high-confidence', async (req, res) => {
  try {
    const { confidenceThreshold = 0.8, limit = 20 } = req.query;
    const logs = await AutonomousAIControllerService.getHighConfidenceActions(
      Number(confidenceThreshold),
      Number(limit)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching high-confidence actions:', error);
    res.status(500).json({ error: 'Failed to fetch high-confidence actions', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/stats/daily
 * @desc Get daily action statistics
 * @access Private
 */
router.get('/action-logs/stats/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const stats = await AutonomousAIControllerService.getDailyStats(
      date ? new Date(date as string) : new Date()
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: 'Failed to fetch daily stats', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/stats/success-rate
 * @desc Get action success rate
 * @access Private
 */
router.get('/action-logs/stats/success-rate', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await AutonomousAIControllerService.getSuccessRate(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching success rate:', error);
    res.status(500).json({ error: 'Failed to fetch success rate', message: (error as Error).message });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/action-logs/stats/performance
 * @desc Get action performance metrics
 * @access Private
 */
router.get('/action-logs/stats/performance', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const metrics = await AutonomousAIControllerService.getPerformanceMetrics(
      Number(days)
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics', message: (error as Error).message });
  }
});

/**
 * @route POST /api/v1/autonomous-ai/action-logs/clean
 * @desc Clean old action logs
 * @access Private
 */
router.post('/action-logs/clean', async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const deletedCount = await AutonomousAIControllerService.cleanOldLogs(daysToKeep);
    res.json({ success: true, data: { deletedCount } });
  } catch (error) {
    console.error('Error cleaning old logs:', error);
    res.status(500).json({ error: 'Failed to clean old logs', message: (error as Error).message });
  }
});

/**
 * @route POST /api/v1/autonomous-ai/action-logs/export
 * @desc Export action logs for analysis
 * @access Private
 */
router.post('/action-logs/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const logs = await AutonomousAIControllerService.exportLogs(
      new Date(startDate),
      new Date(endDate)
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs', message: (error as Error).message });
  }
});

export default router; 