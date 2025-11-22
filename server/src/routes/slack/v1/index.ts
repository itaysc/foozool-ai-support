import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { InsightsSlackService } from '../../../services/slack/insightsSlack.service';

const router = express.Router();

/**
 * POST /slack/insights
 * Post organization insights to Slack channel configured in organization.slackConfig.insights
 * 
 * Body (optional):
 * {
 *   "customers": ["customerId1", "customerId2"] // Array of customer IDs. If null/undefined, sends for all customers
 * }
 */
router.post('/insights', authenticateJWT, hasPermission('slack:write'), async (req, res) => {
  try {
    const organizationId = req.user!.organization;
    
    if (!organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Organization ID not found in user context' 
      });
    }

    const { customers } = req.body; // Array of customer IDs or null/undefined

    const result = await InsightsSlackService.sendInsightsToSlack(
      organizationId.toString(),
      customers && Array.isArray(customers) ? customers : undefined
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Insights successfully posted to Slack'
    });
  } catch (error: any) {
    console.error('Error posting insights to Slack:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;

