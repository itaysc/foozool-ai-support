import express, { Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validateRequest';
import { UserContextManager } from '../../../context/userContext';
import AnomalyService from '../../../services/anomaly-detection/anomaly.service';
import { runAnomalyDetectionForOrganization, runAnomalyDetectionFromBeginning } from '../../../jobs/anomaly-detection.job';
import { z } from 'zod';

const router = express.Router();
const anomalyService = new AnomalyService();

// Validation schemas
const acknowledgeAnomalySchema = z.object({
  notes: z.string().optional()
});

const resolveAnomalySchema = z.object({
  notes: z.string().optional()
});

const markFalsePositiveSchema = z.object({
  notes: z.string().optional()
});

/**
 * GET /api/v1/anomalies
 * Get all anomalies for the authenticated user's organization
 */
router.get('/', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID not found in user context' });
      return;
    }

    const { 
      status = 'active', 
      type, 
      severity, 
      limit = 50, 
      offset = 0,
      hours = 24 
    } = req.query;

    const result = await anomalyService.getAnomalies(
      { organizationId, status: status as string, type: type as string, severity: severity as string, hours: parseInt(hours as string) },
      { limit: parseInt(limit as string), offset: parseInt(offset as string) }
    );

    res.status(200).json({
      status: 200,
      payload: result
    });
  } catch (error: any) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * GET /api/v1/anomalies/stats
 * Get anomaly statistics for the authenticated user's organization
 */
router.get('/stats', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID not found in user context' });
      return;
    }

    const { hours = 24 } = req.query;
    let hoursNum: number | string = 24;
    
    // Handle 'all' case properly
    if (hours === 'all') {
      hoursNum = 'all';
    } else {
      hoursNum = parseInt(hours as string) || 24;
    }

    const stats = await anomalyService.getAnomalyStats(organizationId, hoursNum);

    res.status(200).json({
      status: 200,
      payload: stats
    });
  } catch (error: any) {
    console.error('Error fetching anomaly stats:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * GET /api/v1/anomalies/:id
 * Get a specific anomaly by ID
 */
router.get('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID not found in user context' });
      return;
    }

    const anomaly = await anomalyService.getAnomalyById(id, organizationId);

    if (!anomaly) {
      res.status(404).json({ 
        status: 404,
        payload: { error: 'Anomaly not found' } 
      });
      return;
    }

    res.status(200).json({
      status: 200,
      payload: { anomaly }
    });
  } catch (error: any) {
    console.error('Error fetching anomaly:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/anomalies/:id/acknowledge
 * Acknowledge an anomaly
 */
router.post('/:id/acknowledge', authenticateJWT, validateRequest(acknowledgeAnomalySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!userId || !organizationId) {
      res.status(400).json({ error: 'User ID or Organization ID not found in user context' });
      return;
    }

    const anomaly = await anomalyService.acknowledgeAnomaly(id, organizationId, { userId, notes });

    res.status(200).json({
      status: 200,
      payload: { 
        message: 'Anomaly acknowledged successfully',
        anomaly 
      }
    });
  } catch (error: any) {
    console.error('Error acknowledging anomaly:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/anomalies/:id/resolve
 * Resolve an anomaly
 */
router.post('/:id/resolve', authenticateJWT, validateRequest(resolveAnomalySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!userId || !organizationId) {
      res.status(400).json({ error: 'User ID or Organization ID not found in user context' });
      return;
    }

    const anomaly = await anomalyService.resolveAnomaly(id, organizationId, { userId, notes });

    res.status(200).json({
      status: 200,
      payload: { 
        message: 'Anomaly resolved successfully',
        anomaly 
      }
    });
  } catch (error: any) {
    console.error('Error resolving anomaly:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/anomalies/:id/false-positive
 * Mark an anomaly as false positive
 */
router.post('/:id/false-positive', authenticateJWT, validateRequest(markFalsePositiveSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!userId || !organizationId) {
      res.status(400).json({ error: 'User ID or Organization ID not found in user context' });
      return;
    }

    const anomaly = await anomalyService.markAsFalsePositive(id, organizationId, { userId, notes });

    res.status(200).json({
      status: 200,
      payload: { 
        message: 'Anomaly marked as false positive',
        anomaly 
      }
    });
  } catch (error: any) {
    console.error('Error marking anomaly as false positive:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/anomalies/detect
 * Manually trigger anomaly detection for the authenticated user's organization
 */
router.post('/detect', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID not found in user context' });
      return;
    }

    // Run anomaly detection in background
    runAnomalyDetectionForOrganization(organizationId).catch(error => {
      console.error('Background anomaly detection failed:', error);
    });

    res.status(200).json({
      status: 200,
      payload: { 
        message: 'Anomaly detection started successfully',
        note: 'Detection is running in the background. Check the logs for progress.'
      }
    });
  } catch (error: any) {
    console.error('Error starting anomaly detection:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/anomalies/detect-from-beginning
 * Manually trigger anomaly detection for the authenticated user's organization from the beginning of time
 */
router.post('/detect-from-beginning', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID not found in user context' });
      return;
    }

    // Run anomaly detection in background
    runAnomalyDetectionFromBeginning(organizationId).catch(error => {
      console.error('Background anomaly detection failed:', error);
    });

    res.status(200).json({
      status: 200,
      payload: { 
        message: 'Anomaly detection started successfully from the beginning',
        note: 'Detection is running in the background. Check the logs for progress.'
      }
    });
  } catch (error: any) {
    console.error('Error starting anomaly detection:', error);
    res.status(500).json({ 
      status: 500,
      payload: { error: 'Internal server error', message: error.message } 
    });
  }
});

export default router;
