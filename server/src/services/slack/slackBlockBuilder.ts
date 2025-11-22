import Config from '../../config';
import { truncateText, extractInsightId, splitBlocksIntoChunks } from './slackUtils';
import { 
  formatInsightType, 
  getSeverityEmoji, 
  formatInsightMetadata, 
  getInsightFields 
} from './insightFormatters';

/**
 * Build Slack blocks for insights grouped by customer
 */
export function buildInsightBlocks(insights: any[]): any[] {
  // Group insights by customer
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

  const insightBlocks: any[] = [];

  // Add insights grouped by customer
  for (const [customerKey, customerInsights] of insightsByCustomer.entries()) {
    // Extract customer name (everything after the first underscore)
    const firstUnderscoreIndex = customerKey.indexOf('_');
    const customerName = firstUnderscoreIndex !== -1 
      ? customerKey.substring(firstUnderscoreIndex + 1)
      : customerKey;
    
    // Customer header
    insightBlocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `👤 ${customerName}`,
        emoji: true
      }
    });

    // Group insights by type
    const insightsByType = new Map<string, any[]>();
    customerInsights.forEach((insight: any) => {
      const type = insight.insightType || insight.type || 'general';
      if (!insightsByType.has(type)) {
        insightsByType.set(type, []);
      }
      insightsByType.get(type)!.push(insight);
    });

    // Add insights by type
    for (const [type, typeInsights] of insightsByType.entries()) {
      const typeLabel = formatInsightType(type);
      
      insightBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${typeLabel}* (${typeInsights.length})`
        }
      });

      // Add each insight
      typeInsights.forEach((insight: any) => {
        const severityEmoji = getSeverityEmoji(insight.severity);
        const statusBadge = insight.status ? `\`${insight.status}\`` : '';
        
        let insightText = `${severityEmoji} *${truncateText(insight.message || insight.issueDescription || 'Insight', 200)}*`;
        
        if (statusBadge) {
          insightText += ` ${statusBadge}`;
        }

        // Add metadata if available
        const metadata = formatInsightMetadata(insight);
        if (metadata) {
          insightText += `\n${truncateText(metadata, 200)}`;
        }

        // Truncate to Slack's 3000 character limit for section text
        insightText = truncateText(insightText, 3000);

        // Get insight ID for link
        const insightId = extractInsightId(insight);
        const insightUrl = insightId && Config.CLIENT_APP_URL 
          ? `${Config.CLIENT_APP_URL}/dashboard/insights?insightId=${insightId}`
          : null;

        // Build section block with optional link button
        const sectionBlock: any = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: insightText
          }
        };

        // Add link button if URL is available
        if (insightUrl) {
          sectionBlock.accessory = {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
              emoji: true
            },
            url: insightUrl,
            action_id: 'view_insight'
          };
        }

        insightBlocks.push(sectionBlock);

        // Add context fields if available
        const fields = getInsightFields(insight);
        if (fields.length > 0) {
          insightBlocks.push({
            type: 'section',
            fields: fields.slice(0, 10) // Limit to 10 fields (Slack limit)
          });
        }
      });
    }

    insightBlocks.push({
      type: 'divider'
    });
  }

  return insightBlocks;
}

/**
 * Build message blocks for a chunk of insights
 */
export function buildMessageBlocks(
  chunk: any[],
  organizationName: string,
  totalInsights: number,
  totalCustomers: number,
  isFirstMessage: boolean,
  isLastMessage: boolean,
  partNumber?: number,
  totalParts?: number
): any[] {
  const messageBlocks: any[] = [];

  // Add header
  if (isFirstMessage) {
    messageBlocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Insights Report - ${organizationName}`,
        emoji: true
      }
    });
  } else {
    messageBlocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Insights Report (Part ${partNumber}/${totalParts})`,
        emoji: true
      }
    });
  }

  messageBlocks.push({
    type: 'divider'
  });

  // Add summary only to first message
  if (isFirstMessage) {
    messageBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Total Insights:* ${totalInsights}\n*Customers:* ${totalCustomers}\n*Generated:* ${new Date().toLocaleString()}`
      }
    });
    messageBlocks.push({
      type: 'divider'
    });
  }

  // Add chunk blocks
  messageBlocks.push(...chunk);

  // Add footer only to last message
  if (isLastMessage) {
    messageBlocks.push({
      type: 'divider'
    });
    messageBlocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Generated by TKTAI AI bot | ${new Date().toLocaleDateString()}`
        }
      ]
    });
  }

  return messageBlocks;
}

