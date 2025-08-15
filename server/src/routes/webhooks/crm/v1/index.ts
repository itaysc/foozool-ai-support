import express, { Request, Response } from 'express';
import { authenticateWebhook } from '../../../../middleware/authenticate';
import { handleCRMWebhook } from '../../../../services/tickets/crmWebhook';
import { validateRequest } from '../../../../middleware/validateRequest';
import { crmWebhookValidation } from './validations';
import { CRMService } from '../../../../services/crm';

const router = express.Router();

/**
 * Generic CRM webhook endpoint that can handle any CRM type
 * @route POST /api/v1/webhooks/crm
 */
router.post('/', authenticateWebhook, validateRequest(crmWebhookValidation), async (req: Request, res: Response): Promise<void> => {
  try {
    // authenticateWebhook already validated these, so we can safely access them
    const organizationId = req.headers['x-organization-id'] as string;
    const tokenType = req.headers['x-token-type'] as string;
    
    // Extract CRM type from token type if it follows the pattern
    // Support both explicit crmType in payload and extraction from token type
    let crmType = req.body.crmType;
    
    if (!crmType && tokenType && tokenType.includes('-webhook')) {
      // Extract CRM type from token (e.g., 'zendesk-webhook' -> 'zendesk')
      crmType = tokenType.replace('-webhook', '');
    }
    
    if (!crmType) {
      res.status(400).json({
        success: false,
        error: 'CRM type not specified',
        message: 'Please specify crmType in the payload or use a token type that includes the CRM name'
      });
      return;
    }

    // Add CRM type to the payload if not present
    const payload = {
      ...req.body,
      crmType: crmType
    };

    // Validate that the CRM is supported
    const isSupported = await CRMService.isCRMSupported(crmType);
    if (!isSupported) {
      res.status(400).json({
        success: false,
        error: 'Unsupported CRM type',
        crmType,
        message: `CRM type '${crmType}' is not supported. Please contact support to add support for this CRM.`
      });
      return;
    }

    // Process the webhook
    const webhookRes = await handleCRMWebhook(payload, organizationId);
    res.status(webhookRes.status).json(webhookRes.payload);
    
  } catch (err: any) {
    console.error('Error in generic CRM webhook:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: err.message 
    });
  }
});

export default router;
