import express, { Request, Response } from 'express';
import { authenticateWebhook } from '../../../middleware/authenticate';
import { zendeskWebhookValidation } from '../../webhooks/zendesk/v1/validations';
import { validateRequest } from '../../../middleware/validateRequest';
import { ZendeskAnalysisService } from '../../../services/autonomousAI/zendeskAnalysis.service';
import { ZendeskTicketWebhookPayload } from '../../../types/zendesk/webhookPayload';

const router = express.Router();

/**
 * @route POST /api/v1/autonomous-ai/zendesk-analyze
 * @desc Analyze a Zendesk ticket and get AI recommendations for autonomous actions
 * @access Private (Webhook authenticated)
 */
router.post('/zendesk-analyze', 
  authenticateWebhook, 
  validateRequest(zendeskWebhookValidation), 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket: ZendeskTicketWebhookPayload = req.body;
      const userId = req.user!._id.toString();
      const organizationId = req.user!.organization.toString();

      const result = await ZendeskAnalysisService.analyzeAndExecuteActions({
        ticket,
        userId,
        organizationId
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error analyzing Zendesk ticket for autonomous actions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to analyze ticket for autonomous actions',
        message: (error as Error).message
      });
    }
  }
);

/**
 * @route POST /api/v1/autonomous-ai/zendesk-analyze-only
 * @desc Analyze a Zendesk ticket without executing actions (for preview/testing)
 * @access Private (Webhook authenticated)
 */
router.post('/zendesk-analyze-only', 
  authenticateWebhook, 
  validateRequest(zendeskWebhookValidation), 
  async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket: ZendeskTicketWebhookPayload = req.body;
      const userId = req.user!._id.toString();
      const organizationId = req.user!.organization.toString();

      const result = await ZendeskAnalysisService.analyzeTicketOnly({
        ticket,
        userId,
        organizationId
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error analyzing Zendesk ticket (analysis only):', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to analyze ticket',
        message: (error as Error).message
      });
    }
  }
);

export default router; 