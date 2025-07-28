import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { insightsScheduler } from '../../../jobs/insights/insights-scheduler';
import { InsightsOrchestratorService } from '../../../services/insights/insightsOrchestrator.service';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route GET /api/v1/insights/scheduler/status
 * @desc Get the status of all scheduled jobs
 * @access Private
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = insightsScheduler.getJobStatus();
    
    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch scheduler status',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/scheduler/trigger/:jobName
 * @desc Manually trigger a specific job
 * @access Private
 */
router.post('/trigger/:jobName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobName } = req.params;
    const success = await insightsScheduler.triggerJob(jobName);

    if (success) {
      res.status(200).json({
        success: true,
        message: `Job ${jobName} triggered successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to trigger job ${jobName}`
      });
    }

  } catch (error) {
    console.error('Error triggering job:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to trigger job',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/scheduler/start
 * @desc Start the insights scheduler
 * @access Private
 */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    insightsScheduler.start();
    
    res.status(200).json({
      success: true,
      message: 'Insights scheduler started successfully'
    });

  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start scheduler',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/scheduler/stop
 * @desc Stop the insights scheduler
 * @access Private
 */
router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    insightsScheduler.stop();
    
    res.status(200).json({
      success: true,
      message: 'Insights scheduler stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to stop scheduler',
      message: (error as Error).message
    });
  }
});

/**
 * @route PUT /api/v1/insights/scheduler/job/:jobName
 * @desc Update job configuration
 * @access Private
 */
router.put('/job/:jobName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobName } = req.params;
    const updates = req.body;

    const success = insightsScheduler.updateJobConfig(jobName, updates);

    if (success) {
      res.status(200).json({
        success: true,
        message: `Job ${jobName} configuration updated successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to update job ${jobName} configuration`
      });
    }

  } catch (error) {
    console.error('Error updating job configuration:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update job configuration',
      message: (error as Error).message
    });
  }
});

/**
 * @route POST /api/v1/insights/scheduler/generate
 * @desc Manually generate insights for organization
 * @access Private
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user!.organization.toString();
    const { timeRange, includeTrends, includeAnomalies, includeTopIssues } = req.body;

    const orchestratorService = new InsightsOrchestratorService();
    const result = await orchestratorService.generateInsightsForOrganization(organizationId, {
      timeRange,
      includeTrends,
      includeAnomalies,
      includeTopIssues
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate insights',
      message: (error as Error).message
    });
  }
});

export default router; 