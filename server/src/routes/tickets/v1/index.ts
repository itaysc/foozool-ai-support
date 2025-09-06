import express, { Request, Response } from 'express';
import { validateRequest } from '../../../middleware/validateRequest';
import { handleWebhook } from '../../../services/tickets';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { newTicket } from './validations';

const router = express.Router();

router.post('/webhook', authenticateJWT, hasPermission('tickets:update'), validateRequest(newTicket), async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookRes = await handleWebhook(req.body);
    res.status(webhookRes.status).json(webhookRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;