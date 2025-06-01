import express, { Request, Response } from 'express';
import { findZendeskSimilarTickets, handleWebhook } from '../../../services/tickets';
import { validateRequest } from 'src/middleware/validateRequest';
import { newTicket } from './validations';
import { authenticateJWT } from 'src/middleware/authenticate';

const router = express.Router();

router.post('/webhook', authenticateJWT, validateRequest(newTicket), async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookRes = await handleWebhook(req.user!._id.toString(), req.body);
    res.status(webhookRes.status).json(webhookRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;