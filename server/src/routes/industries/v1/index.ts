import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { IndustryModel } from '../../../schemas/industry.schema';
import { UserContextManager } from '../../../context/userContext';

const router = Router();

router.use(authenticateJWT);

// GET /api/v1/industries
// Returns global industries (organizationId: null) + org-specific industries
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    const query = organizationId
      ? { $or: [{ organizationId: null }, { organizationId }] }
      : { organizationId: null };

    const industries = await IndustryModel.find(query).sort({ name: 1 }).lean();
    res.json({ industries });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

export default router;


