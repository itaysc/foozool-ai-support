/**
 * Utility functions for Slack integration
 */

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if a string is a valid MongoDB ObjectId format (24 hex characters)
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Extract insight ID from insight object (checks multiple possible fields)
 */
export function extractInsightId(insight: any): string | null {
  if (insight.id && isValidObjectId(insight.id)) {
    return insight.id;
  }
  if (insight._id) {
    const idStr = insight._id.toString();
    if (isValidObjectId(idStr)) {
      return idStr;
    }
  }
  if (insight.clusterId && isValidObjectId(insight.clusterId)) {
    return insight.clusterId;
  }
  return null;
}

/**
 * Split blocks into chunks respecting Slack's 50 block limit
 */
export function splitBlocksIntoChunks(blocks: any[]): any[][] {
  const MAX_BLOCKS_PER_MESSAGE = 50;
  const RESERVED_BLOCKS = 6; // Conservative estimate for headers/footers
  const AVAILABLE_BLOCKS = MAX_BLOCKS_PER_MESSAGE - RESERVED_BLOCKS;

  const chunks: any[][] = [];
  for (let i = 0; i < blocks.length; i += AVAILABLE_BLOCKS) {
    chunks.push(blocks.slice(i, i + AVAILABLE_BLOCKS));
  }

  return chunks;
}

