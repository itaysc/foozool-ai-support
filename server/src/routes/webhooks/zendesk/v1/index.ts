import express, { Request, Response } from 'express';
import { authenticateWebhook } from '../../../../middleware/authenticate';
import { handleWebhook } from '../../../../services/tickets';
import { handleCRMWebhook } from '../../../../services/tickets/crmWebhook';
import { convertZendeskToCRMWebhook } from '../../../../services/tickets/crmWebhook';
import { zendeskWebhookValidation } from './validations';
import { validateRequest } from '../../../../middleware/validateRequest';
import { OrganizationModel } from '../../../../schemas/organization.schema';
import { UserModel } from '../../../../schemas/user.schema';
import { CRMService } from '../../../../services/crm';

const router = express.Router();

async function validateWebhookHeaders(headers: any) {
  let isValid = true;
  const tokenType = headers['x-token-type'];
  
  // Support both legacy zendesk-webhook and new CRM-agnostic format
  if (!tokenType || !tokenType.toString().endsWith('-webhook')) {
    isValid = false;
  }
  
  const organizationId = headers['x-organization-id'];
  const organization = await OrganizationModel.findById(organizationId);
  if (!organization) {
    isValid = false;
  }
  const userId = headers['x-user-id'];
  const user = await UserModel.findById(userId);
  if (!user) {
    isValid = false;
  }
  return { isValid, organizationId, userId };
}

router.post('/', authenticateWebhook, validateRequest(zendeskWebhookValidation), async (req: Request, res: Response): Promise<void> => {
  try {
    const { isValid, organizationId } = await validateWebhookHeaders(req.headers);
    if (!isValid) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if organization has CRM configuration
    const crmData = await CRMService.getOrganizationCRM(organizationId);
    
    if (crmData && crmData.crm.type === 'zendesk') {
      // Organization is configured to use Zendesk, use CRM-agnostic handler
      const crmPayload = convertZendeskToCRMWebhook(req.body);
      const webhookRes = await handleCRMWebhook(crmPayload, organizationId);
      res.status(webhookRes.status).json(webhookRes.payload);
    } else {
      // Fallback to legacy Zendesk handler for backward compatibility
      const webhookRes = await handleWebhook(req.body);
      res.status(webhookRes.status).json(webhookRes.payload);
    }
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;