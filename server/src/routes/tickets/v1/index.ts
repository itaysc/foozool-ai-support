import express, { Request, Response } from 'express';
import { validateRequest } from '../../../middleware/validateRequest';
import { handleWebhook } from '../../../services/tickets';
import { authenticateJWT } from '../../../middleware/authenticate';
import { newTicket } from './validations';

const router = express.Router();

router.post('/webhook', authenticateJWT, validateRequest(newTicket), async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookRes = await handleWebhook(req.body);
    res.status(webhookRes.status).json(webhookRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;