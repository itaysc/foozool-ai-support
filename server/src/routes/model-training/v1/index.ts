import express, { Request, Response } from 'express';
import { trainModel, loadStubData3 } from '../../../services/model-training';
import { validateRequest } from 'src/middleware/validateRequest';
import { trainModelSchema } from './validations';

const router = express.Router();

router.post('/zendesk', validateRequest(trainModelSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userRes = await trainModel(req.body);
    res.status(userRes.status).json(userRes.payload);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/stub', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRes = await loadStubData3();
    res.status(userRes.status).json(userRes.payload);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;