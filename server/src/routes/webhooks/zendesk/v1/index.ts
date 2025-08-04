import express, { Request, Response } from 'express';
import { authenticateWebhook } from 'src/middleware/authenticate';
import { handleWebhook } from 'src/services/tickets';
import { zendeskWebhookValidation } from './validations';
import { validateRequest } from 'src/middleware/validateRequest';
import { OrganizationModel } from 'src/schemas/organization.schema';
import { UserModel } from 'src/schemas/user.schema';

const router = express.Router();

async function validateWebhookHeaders(headers: any) {
  let isValid = true;
  const tokenType = headers['x-token-type'];
  if (tokenType !== 'zendesk-webhook') {
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
    const { isValid } = await validateWebhookHeaders(req.headers);
    if (!isValid) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const webhookRes = await handleWebhook(req.body);
    res.status(webhookRes.status).json(webhookRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;