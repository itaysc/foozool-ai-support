import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { InsightsSlackService } from '../../../services/slack/insightsSlack.service';
import { OrganizationModel, CustomerModel } from '../../../schemas';

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

/**
 * POST /slack/slash
 * Handle Slack slash command to get insights for a customer
 * 
 * Slack sends slash commands as form-urlencoded POST requests with:
 * - team_id: Slack workspace ID
 * - text: Command text (customer name)
 * - user_id: User who invoked the command
 * - response_url: URL to send delayed responses
 */
router.post('/slash', async (req, res) => {
  // Log the incoming request for debugging
  console.log('Slack slash command received:', {
    body: req.body,
    bodyKeys: Object.keys(req.body || {}),
    contentType: req.headers['content-type'],
    method: req.method
  });

  let responseUrl: string | undefined;
  
  try {
    // Slack sends slash commands as form-urlencoded
    const { team_id, text, user_id, response_url, channel_id } = req.body || {};
    responseUrl = response_url;

    console.log('Parsed Slack command:', { team_id, text, user_id, hasResponseUrl: !!response_url });

    // Validate required fields
    if (!team_id) {
      console.error('Missing team_id in Slack slash command');
      return res.status(200).json({
        response_type: 'ephemeral',
        text: '❌ Error: Missing team_id. Please contact support.'
      });
    }

    // Respond immediately to Slack (within 3 seconds) - this is critical!
    // Slack requires a response within 3 seconds
    const immediateResponse = {
      response_type: 'ephemeral' as const,
      text: text && text.trim()
        ? `Fetching insights for "${text.trim()}"...`
        : 'Please provide a customer name. Usage: /insights <customer_name>'
    };

    console.log('Sending immediate response to Slack:', immediateResponse);
    res.status(200).json(immediateResponse);

    // If no customer name provided, return early
    if (!text || !text.trim()) {
      return;
    }

    const customerName = text.trim();

    // Find organization by Slack team_id
    // First try to find by teamId in slackConfig, if not found, try to find by team_id
    // We'll need to store teamId in slackConfig.insights when setting up the integration
    let organization = await OrganizationModel.findOne({
      'slackConfig.insights.teamId': team_id
    }).lean();

    // If not found by teamId, try to find any organization with slackConfig
    // This is a fallback - ideally teamId should be stored in slackConfig
    if (!organization) {
      const organizations = await OrganizationModel.find({
        'slackConfig.insights.botToken': { $exists: true }
      }).lean();
      
      // If only one organization has Slack configured, use it
      // Otherwise, we need teamId to be stored
      if (organizations.length === 1) {
        organization = organizations[0];
      } else if (organizations.length > 1) {
        // Multiple organizations - need teamId to identify
        await sendSlackResponse(response_url, {
          response_type: 'ephemeral',
          text: '❌ Multiple organizations found. Please configure teamId in slackConfig.insights for proper mapping.'
        });
        return;
      }
    }

    if (!organization) {
      console.error('No organization found for team_id:', team_id);
      // Send error message to Slack
      if (responseUrl) {
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: '❌ No organization found with Slack integration configured. Please ensure teamId is set in slackConfig.insights.'
        });
      }
      return;
    }

    // Find customer by name in the organization
    const customer = await CustomerModel.findOne({
      organizationId: organization._id.toString(),
      name: { $regex: new RegExp(customerName, 'i') } // Case-insensitive search
    }).lean();

    if (!customer) {
      console.log(`Customer "${customerName}" not found in organization "${organization.name}"`);
      if (responseUrl) {
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: `❌ Customer "${customerName}" not found in organization "${organization.name}".`
        });
      }
      return;
    }

    console.log(`Found customer: ${customer.name} (${customer._id})`);

    // Send insights for the customer
    const result = await InsightsSlackService.sendInsightsToSlack(
      organization._id.toString(),
      [customer._id.toString()]
    );

    if (!result.success) {
      console.error('Failed to send insights:', result.error);
      if (responseUrl) {
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: `❌ Failed to send insights: ${result.error}`
        });
      }
      return;
    }

    // Send success confirmation
    if (responseUrl) {
      await sendSlackResponse(responseUrl, {
        response_type: 'ephemeral',
        text: `✅ Insights for "${customer.name}" have been posted to the configured channel.`
      });
    }

  } catch (error: any) {
    console.error('Error handling Slack slash command:', error);
    console.error('Error stack:', error.stack);
    // Try to send error to Slack if response_url is available
    if (responseUrl) {
      try {
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: `❌ An error occurred while processing your request: ${error.message || 'Unknown error'}. Please try again later.`
        });
      } catch (err) {
        console.error('Failed to send error response to Slack:', err);
      }
    }
  }
});

/**
 * Helper function to send response to Slack using response_url
 */
async function sendSlackResponse(responseUrl: string, payload: any): Promise<void> {
  try {
    const axios = (await import('axios')).default;
    await axios.post(responseUrl, payload);
  } catch (error) {
    console.error('Failed to send response to Slack:', error);
  }
}

export default router;

