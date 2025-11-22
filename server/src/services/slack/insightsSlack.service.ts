import { WebClient } from '@slack/web-api';
import { OrganizationModel } from '../../schemas';
import { fetchAllInsightsForOrganization } from './insightFetcher';
import { buildInsightBlocks, buildMessageBlocks } from './slackBlockBuilder';
import { splitBlocksIntoChunks } from './slackUtils';

const MAX_BLOCKS_PER_MESSAGE = 50;

/**
 * Service for sending insights to Slack channels
 */
export class InsightsSlackService {
  /**
   * Send organization insights to Slack channel
   * Groups insights by customer and formats them nicely with Slack blocks
   * 
   * @param organizationId - The organization ID
   * @param customerIds - Optional array of customer IDs to filter insights. If undefined/null, sends for all customers
   */
  static async sendInsightsToSlack(
    organizationId: string,
    customerIds?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get organization with Slack config
      const organization = await OrganizationModel.findById(organizationId).lean();
      
      if (!organization) {
        return { success: false, error: 'Organization not found' };
      }

      if (!organization.slackConfig?.insights?.channelId || !organization.slackConfig?.insights?.botToken) {
        return { 
          success: false, 
          error: 'Slack configuration not found. Please configure channelId and botToken in organization.slackConfig.insights' 
        };
      }

      const { channelId, botToken } = organization.slackConfig.insights;

      // Initialize Slack client
      const client = new WebClient(botToken);

      // Fetch all insights for the organization (optionally filtered by customers)
      const insights = await fetchAllInsightsForOrganization(organizationId, customerIds);
        
      if (!insights || insights.length === 0) {
        return { 
          success: false, 
          error: 'No insights found for this organization' 
        };
      }

      // Build insight blocks
      const insightBlocks = buildInsightBlocks(insights);

      // Group insights by customer for summary
      const insightsByCustomer = new Map<string, any[]>();
      insights.forEach((insight: any) => {
        const customerName = insight.customerName || 'Unknown Customer';
        const customerId = insight.customerId || 'unknown';
        const key = `${customerId}_${customerName}`;
        
        if (!insightsByCustomer.has(key)) {
          insightsByCustomer.set(key, []);
        }
        insightsByCustomer.get(key)!.push(insight);
      });

      // Split blocks into chunks
      const chunks = splitBlocksIntoChunks(insightBlocks);

      // Send each chunk as a separate message
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isFirstMessage = i === 0;
        const isLastMessage = i === chunks.length - 1;
        const totalMessages = chunks.length;

        // Build message blocks
        const messageBlocks = buildMessageBlocks(
          chunk,
          organization.name,
          insights.length,
          insightsByCustomer.size,
          isFirstMessage,
          isLastMessage,
          i + 1,
          totalMessages
        );

        // Ensure we don't exceed 50 blocks
        if (messageBlocks.length > MAX_BLOCKS_PER_MESSAGE) {
          messageBlocks.splice(MAX_BLOCKS_PER_MESSAGE);
        }

        // Send message to Slack
        const result = await client.chat.postMessage({
          channel: channelId,
          blocks: messageBlocks,
          text: `Insights Report for ${organization.name}${totalMessages > 1 ? ` (Part ${i + 1}/${totalMessages})` : ''}` // Fallback text
        });

        if (!result.ok) {
          return { 
            success: false, 
            error: `Failed to send message to Slack: ${result.error || 'Unknown error'}` 
          };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sending insights to Slack:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send insights to Slack' 
      };
    }
  }
}
