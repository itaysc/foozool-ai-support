import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { z } from 'zod';
import { createBot, getBots } from '../../../services/bots';
import { hasPermission } from '../../../middleware/permissions';

const router = Router();
router.use(authenticateJWT);

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['customer_success', 'issue_insights', 'predictions', 'nps']),
});

router.get('/', hasPermission('bots:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(400).json({ status: 400, error: 'Organization ID not found in user context' });
    const bots = await getBots(organizationId);
    return res.status(200).json({ status: 200, payload: bots });
  } catch (err) {
    console.error('Error fetching bots:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

router.post('/', hasPermission('bots:create'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const userId = UserContextManager.getCurrentUserId();
    if (!organizationId || !userId) return res.status(400).json({ status: 400, error: 'Missing org or user context' });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 400, error: 'Validation failed', details: parsed.error.issues });

    const bot = await createBot(organizationId, userId, parsed.data);
    return res.status(201).json({ status: 201, payload: bot });
  } catch (err) {
    console.error('Error creating bot:', err);
    return res.status(500).json({ status: 500, error: 'Internal server error' });
  }
});

export default router;


