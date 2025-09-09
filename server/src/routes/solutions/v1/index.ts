import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { SolutionModel } from '../../../schemas/solution.schema';
// Legacy feature usage removed; use /customer-activity instead
import { hasPermission } from '../../../middleware/permissions';

const router = Router();

router.use(authenticateJWT);

// Create or get feature
router.post('/', hasPermission('solutions:create'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const solution = await SolutionModel.findOneAndUpdate(
      { name, organizationId },
      { $setOnInsert: { name, organizationId } },
      { upsert: true, new: true }
    );
    res.json({ solution });
  } catch (e) {
    res.status(500).json({ error: 'Failed to upsert feature' });
  }
});

router.get('/', hasPermission('solutions:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const solutions = await SolutionModel.find({ organizationId }).sort({ name: 1 }).lean();
    res.json({ solutions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

export default router;


