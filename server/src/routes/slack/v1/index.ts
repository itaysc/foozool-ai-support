import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { InsightsSlackService } from '../../../services/slack/insightsSlack.service';
import { SlackSearchService } from '../../../services/slack/slackSearch.service';
import { OrganizationModel, CustomerModel, UserModel } from '../../../schemas';
import { UserContextManager } from '../../../context/userContext';
import { callLLM } from '../../../services/llm';
import { buildAnalyzeCustomerSlackConversationsPrompt } from '../../../services/slack/prompts/analyzeCustomerSlackConversations.prompt';

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
 * GET /slack/search/messages
 * Search public-channel messages in Slack for a customer name.
 *
 * Query:
 * - q (required): customer name to search for
 * - limit (optional, default 20, max 100)
 * - page (optional, default 1)
 * - sort (optional: score|timestamp, default score)
 * - sortDir (optional: asc|desc, default desc)
 *
 * Notes:
 * - Search is performed using the organization's configured Slack bot token.
 * - Slack may reject `search.messages` for bot tokens (xoxb). In that case we fall back to scanning recent channel history
 *   using `conversations.list` + `conversations.history` (slower, and still limited to content the bot can access).
 */
router.get('/search/messages', authenticateJWT, hasPermission('search:read'), async (req, res) => {
  try {
    const organizationId = req.user!.organization;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found in user context'
      });
    }

    const qRaw = typeof req.query.q === 'string' ? req.query.q : '';
    const q = qRaw.trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query param: q'
      });
    }

    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const sortDirRaw = typeof req.query.sortDir === 'string' ? req.query.sortDir : undefined;

    const limit = Number.isFinite(limitRaw) && (limitRaw as number) > 0 ? Math.min(limitRaw as number, 100) : 20;
    const page = Number.isFinite(pageRaw) && (pageRaw as number) > 0 ? Math.floor(pageRaw as number) : 1;
    const sort = sortRaw === 'timestamp' ? 'timestamp' : 'score';
    const sortDir = sortDirRaw === 'asc' ? 'asc' : 'desc';

    const result = await SlackSearchService.searchMessages({
      organizationId: organizationId.toString(),
      q,
      limit,
      page,
      sort,
      sortDir
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error searching Slack messages:', error);
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
    const { team_id, text, user_id, response_url, channel_id, command } = req.body || {};
    responseUrl = response_url;

    console.log('Parsed Slack command:', { team_id, command, text, user_id, channel_id, hasResponseUrl: !!response_url });

    // Validate required fields
    if (!team_id) {
      console.error('Missing team_id in Slack slash command');
      return res.status(200).json({
        response_type: 'ephemeral',
        text: '❌ Error: Missing team_id. Please contact support.'
      });
    }

    const rawText = typeof text === 'string' ? text.trim() : '';
    const rawCommand = typeof command === 'string' ? command.trim() : '';
    const isAnalyzeCommand =
      rawCommand === '/analyze' ||
      rawText.toLowerCase().startsWith('analyze ');

    // Extract customer name for analyze mode (supports "/analyze <name>" or "/insights analyze <name>")
    const analyzeCustomerName = isAnalyzeCommand
      ? (rawText.toLowerCase().startsWith('analyze ')
          ? rawText.slice('analyze '.length).trim()
          : rawText)
      : '';

    // Respond immediately to Slack (within 3 seconds) - this is critical!
    // Slack requires a response within 3 seconds
    const immediateResponse = {
      response_type: 'ephemeral' as const,
      text: isAnalyzeCommand
        ? (analyzeCustomerName
            ? `Analyzing Slack conversations mentioning "${analyzeCustomerName}"...`
            : 'Please provide a customer name. Usage: /analyze <customer_name>')
        : (rawText
            ? `Fetching insights for "${rawText}"...`
            : 'Please provide a customer name. Usage: /insights <customer_name>')
    };

    console.log('Sending immediate response to Slack:', immediateResponse);
    res.status(200).json(immediateResponse);

    // If no command text provided, return early
    if (!rawText) {
      return;
    }

    // If analyze command without name, return early (we already sent usage)
    if (isAnalyzeCommand && !analyzeCustomerName) {
      return;
    }

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

    // Set user context with organizationId so downstream services work.
    // For LLM usage tracking, prefer a stable real userId from this organization (avoids creating many service usage rows).
    const orgUser = await UserModel.findOne({ organization: organization._id }).select('_id').lean();
    const orgUserId = orgUser?._id?.toString();
    UserContextManager.setServiceContext(organization._id.toString(), orgUserId);

    // Handle /analyze (or "analyze <name>")
    if (isAnalyzeCommand) {
      const customerName = analyzeCustomerName;

      const searchResult = await SlackSearchService.searchMessages({
        organizationId: organization._id.toString(),
        q: customerName,
        limit: 50,
        page: 1,
        sort: 'timestamp',
        sortDir: 'desc'
      });

      if (!searchResult.success) {
        if (responseUrl) {
          await sendSlackResponse(responseUrl, {
            response_type: 'ephemeral',
            text: `❌ Slack search failed: ${searchResult.error}`
          });
        }
        return;
      }

      const matchesWithText = (searchResult.matches || []).filter(m => (m.text || '').trim().length > 0);
      if (matchesWithText.length === 0) {
        if (responseUrl) {
          await sendSlackResponse(responseUrl, {
            response_type: 'ephemeral',
            text: `No relevant Slack messages found for "${customerName}". If you expected matches, make sure the bot is invited to the channels where the conversations happened.`
          });
        }
        return;
      }

      // Build conversation context (bounded to avoid oversized prompts)
      const MAX_MESSAGES = 30;
      const MAX_CHARS_TOTAL = 12000;
      const MAX_CHARS_PER_MESSAGE = 600;

      let conversationText = '';
      let included = 0;
      for (const m of matchesWithText.slice(0, MAX_MESSAGES)) {
        const channelLabel = m.channel?.name ? `#${m.channel.name}` : `#${m.channel.id}`;
        const permalink = m.permalink ? ` ${m.permalink}` : '';
        const ts = Number.parseFloat(m.ts);
        const tsIso = Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : m.ts;
        const msgText = (m.text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS_PER_MESSAGE);

        const block = `- ${channelLabel} @ ${tsIso}${permalink}\n  ${msgText}\n`;
        if (conversationText.length + block.length > MAX_CHARS_TOTAL) break;
        conversationText += block;
        included += 1;
      }

      const prompt = buildAnalyzeCustomerSlackConversationsPrompt({
        customerName,
        conversationText
      });

      const llmUserId = UserContextManager.getCurrentUserId() || orgUserId || '';
      const llmResp = await callLLM({
        userId: llmUserId,
        isChat: true,
        prompt,
        maxTokens: 600,
        temperature: 0.2
      });

      const answerRaw = (llmResp.data || '').trim();
      const answer = answerRaw || 'No meaningful insights found.';
      const slackText = answer.length > 3500 ? `${answer.slice(0, 3500)}...` : answer;

      if (responseUrl) {
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: slackText
        });
      }

      console.log('Analyze slash command complete', {
        organizationId: organization._id?.toString(),
        customerName,
        includedMessages: included,
        slackSearchMode: (searchResult as any).meta?.mode
      });

      return;
    }

    // Default behavior: /insights <customer name>
    const customerName = rawText;

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

