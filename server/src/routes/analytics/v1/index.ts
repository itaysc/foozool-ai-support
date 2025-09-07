import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { UserContextManager } from '../../../context/userContext';
import { UserActivityService } from '../../../services/analytics/userActivity.service';

const router = express.Router();

// POST /api/v1/analytics/user-activity
router.post('/user-activity', authenticateJWT, async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const userId = req.user!._id.toString();
    if (!organizationId) return res.status(400).json({ message: 'No organization in context' });
    const { event, weight, metadata } = req.body || {};
    if (!event) return res.status(400).json({ message: 'event is required' });
    await UserActivityService.logEvent({ organizationId, userId, event, weight, metadata });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to log activity' });
  }
});

// GET /api/v1/analytics/top-users?days=30&limit=10
router.get('/top-users', authenticateJWT, hasPermission('users:read'), async (req, res) => {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) return res.status(400).json({ message: 'No organization in context' });
    const days = req.query.days ? Number(req.query.days) : 30;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const data = await UserActivityService.getTopUsers({ organizationId, days, limit });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch top users' });
  }
});

export default router;


