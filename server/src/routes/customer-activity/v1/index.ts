import { Router } from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { UserContextManager } from '../../../context/userContext';
import { createActivity, listActivities, deleteActivity } from '../../../services/customer-activity';

const router = Router();

router.get('/', authenticateJWT, hasPermission('customers:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(400).json({ status: 400, error: 'Missing organization' });
    const { customerId } = req.query as any;
    const items = await listActivities({ organizationId, customerId });
    res.json({ status: 200, payload: items });
  } catch (e: any) {
    res.status(500).json({ status: 500, error: e?.message || 'Failed to list activities' });
  }
});

router.post('/', authenticateJWT, hasPermission('customers:update'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(400).json({ status: 400, error: 'Missing organization' });
    const created = await createActivity({ ...req.body, organizationId });
    res.status(201).json({ status: 201, payload: created });
  } catch (e: any) {
    res.status(500).json({ status: 500, error: e?.message || 'Failed to create activity' });
  }
});

router.delete('/:id', authenticateJWT, hasPermission('customers:update'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(400).json({ status: 400, error: 'Missing organization' });
    const { id } = req.params;
    await deleteActivity(id, organizationId);
    res.json({ status: 200, message: 'Activity deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ status: 500, error: e?.message || 'Failed to delete activity' });
  }
});

export default router;


