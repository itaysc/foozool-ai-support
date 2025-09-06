import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { UserContextManager } from '../../../context/userContext';
import { FeatureModel } from '../../../schemas/feature.schema';
import { FeatureUsageModel } from '../../../schemas/featureUsage.schema';
import { hasPermission } from '../../../middleware/permissions';

const router = Router();

router.use(authenticateJWT);

// Create or get feature
router.post('/', hasPermission('features:create'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const feature = await FeatureModel.findOneAndUpdate(
      { name, organizationId },
      { $setOnInsert: { name, organizationId } },
      { upsert: true, new: true }
    );
    res.json({ feature });
  } catch (e) {
    res.status(500).json({ error: 'Failed to upsert feature' });
  }
});

router.get('/', hasPermission('features:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const features = await FeatureModel.find({ organizationId }).sort({ name: 1 }).lean();
    res.json({ features });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// Feature usage: create or update for a customer
router.post('/usage', hasPermission('features:update'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const { featureId, featureName, customerId, activeUsersCount, utilizationPercent, usageDate } = req.body;
    if (!featureId && !featureName) return res.status(400).json({ error: 'featureId or featureName is required' });
    let finalFeatureId = featureId;
    let finalFeatureName = featureName;
    if (!finalFeatureId && finalFeatureName) {
      const feat = await FeatureModel.findOneAndUpdate(
        { name: finalFeatureName, organizationId },
        { $setOnInsert: { name: finalFeatureName, organizationId } },
        { upsert: true, new: true }
      );
      finalFeatureId = feat._id;
    }
    const usage = await FeatureUsageModel.create({
      organizationId,
      featureId: finalFeatureId,
      featureName: finalFeatureName,
      customerId,
      activeUsersCount,
      utilizationPercent,
      usageDate: usageDate ? new Date(usageDate) : undefined,
    });
    res.json({ usage });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save feature usage' });
  }
});

router.get('/usage', hasPermission('features:read'), async (req: Request, res: Response) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(401).json({ error: 'No organization context' });
    const { customerId } = req.query as { customerId?: string };
    const query: any = { organizationId };
    if (customerId) query.customerId = customerId;
    const usage = await FeatureUsageModel.find(query).lean();
    res.json({ usage });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch feature usage' });
  }
});

export default router;


