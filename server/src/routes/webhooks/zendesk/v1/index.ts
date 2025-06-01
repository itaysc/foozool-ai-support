import express, { Request, Response } from 'express';
import { findOrganizationBySignature } from 'src/services/organizations';
import { handleZendeskWebhook } from 'src/services/zendesk';

const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-foozool-signature'];
    if (!signature) {
      res.status(400).json({ message: 'Signature is required' });
      return;
    }
    const organization = await findOrganizationBySignature(signature as string);
    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }
    const { data } = req.body;
    await handleZendeskWebhook(organization, data);
    res.status(200).json({ message: 'Webhook acknowledged' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;