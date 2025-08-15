import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { ThresholdMissService } from '../../../services/autonomousAI/thresholdMiss.service';

const router = Router();

/**
 * @route GET /api/v1/autonomous-ai/threshold-misses/summary
 * @desc Get threshold miss summary for the organization
 * @access Private
 */
router.get('/summary', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organization;
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID not found'
      });
      return;
    }

    const summary = await ThresholdMissService.getThresholdMissSummary(organizationId.toString());
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching threshold miss summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threshold miss summary',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/threshold-misses/stats
 * @desc Get threshold miss statistics for a specific time range
 * @access Private
 */
router.get('/stats', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organization;
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID not found'
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
      return;
    }

    const stats = await ThresholdMissService.getThresholdMissStats(organizationId.toString(), start, end);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching threshold miss stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threshold miss stats',
      message: (error as Error).message
    });
  }
});

/**
 * @route GET /api/v1/autonomous-ai/threshold-misses/details
 * @desc Get detailed threshold misses for a specific time range
 * @access Private
 */
router.get('/details', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organization;
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'Organization ID not found'
      });
      return;
    }

    const { startDate, endDate, limit = '100', skip = '0' } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const limitNum = parseInt(limit as string, 10);
    const skipNum = parseInt(skip as string, 10);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
      return;
    }

    const result = await ThresholdMissService.getThresholdMisses(
      organizationId.toString(), 
      start, 
      end, 
      limitNum, 
      skipNum
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching threshold miss details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threshold miss details',
      message: (error as Error).message
    });
  }
});

export default router;
