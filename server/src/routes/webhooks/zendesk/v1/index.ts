import express, { Request, Response } from 'express';
import { authenticateWebhook } from 'src/middleware/authenticate';
import { handleWebhook } from 'src/services/tickets';

const router = express.Router();

router.post('/', authenticateWebhook, async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookRes = await handleWebhook(req.user!._id.toString(), req.body);
    res.status(webhookRes.status).json(webhookRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;