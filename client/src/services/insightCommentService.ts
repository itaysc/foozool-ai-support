import axios from './axios';
import config from '@/config';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/${endpoint}`;
};

export interface InsightComment {
  _id: string;
  title?: string;
  description: string;
  insight: string;
  insightNumber: string;
  taggedUsers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  index: number;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  title?: string;
  description: string;
  insightId: string;
  taggedUserIds?: string[];
}

export interface UpdateCommentInput {
  title?: string;
  description?: string;
  taggedUserIds?: string[];
}

class InsightCommentService {
  /**
   * Create a new comment
   */
  async createComment(input: CreateCommentInput): Promise<InsightComment> {
    const response = await axios.post(getRoute(`insights/${input.insightId}/comment`), {
      title: input.title,
      description: input.description,
      taggedUserIds: input.taggedUserIds
    });
    return response.data;
  }

  /**
   * Get comments by insight ID
   */
  async getCommentsByInsight(insightId: string): Promise<InsightComment[]> {
    const response = await axios.get(getRoute(`insights/${insightId}/comments`));
    return response.data;
  }

  /**
   * Get comments by insight number
   */
  async getCommentsByInsightNumber(insightNumber: string): Promise<InsightComment[]> {
    const response = await axios.get(getRoute(`insights/insight-number/${insightNumber}`));
    return response.data;
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(insightId: string, commentId: string): Promise<InsightComment> {
    const response = await axios.get(getRoute(`insights/${insightId}/comments/${commentId}`));
    return response.data;
  }

  /**
   * Update a comment
   */
  async updateComment(insightId: string, commentId: string, updates: UpdateCommentInput): Promise<InsightComment> {
    const response = await axios.put(getRoute(`insights/${insightId}/comments/${commentId}`), updates);
    return response.data;
  }

  /**
   * Delete a comment
   */
  async deleteComment(insightId: string, commentId: string): Promise<void> {
    await axios.delete(getRoute(`insights/${insightId}/comments/${commentId}`));
  }

  /**
   * Get comments where a user is tagged
   */
  async getCommentsByTaggedUser(userId: string): Promise<InsightComment[]> {
    const response = await axios.get(getRoute(`insights/tagged/${userId}`));
    return response.data;
  }

  /**
   * Parse tagged users from comment description
   * Format: @[userId]
   */
  parseTaggedUsers(description: string): string[] {
    const taggedUsers: string[] = [];
    
    // Find @[userId] patterns
    const userIdMatches = description.match(/@\[[a-f0-9]{24}\]/g);
    if (userIdMatches) {
      userIdMatches.forEach(match => {
        const userId = match.substring(2, match.length - 1); // Remove @[ and ]
        if (!taggedUsers.includes(userId)) {
          taggedUsers.push(userId);
        }
      });
    }
    
    return taggedUsers;
  }

  /**
   * Replace user names with user IDs in description for server
   * Format: @userName -> @[userId]
   */
  replaceUserNamesWithIds(description: string, userMap: Map<string, string>): string {
    let processedDescription = description;
    
    // Sort user names by length (longest first) to match full names before partial names
    const sortedUserNames = Array.from(userMap.keys()).sort((a, b) => b.length - a.length);
    
    for (const userName of sortedUserNames) {
      // Skip if it's already in the @[userId] format
      if (/^\[[a-f0-9]{24}\]$/.test(userName)) continue;
      
      const userId = userMap.get(userName);
      if (userId) {
        // Create a regex that matches the full name as a word boundary
        const escapedName = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@\\b${escapedName}\\b`, 'gi');
        processedDescription = processedDescription.replace(regex, `@[${userId}]`);
      }
    }
    
    return processedDescription;
  }

  /**
   * Replace user IDs with user names in description for display
   * Format: @[userId] -> @userName
   */
  replaceUserIdsWithNames(description: string, userMap: Map<string, { name: string; email: string }>): string {
    let processedDescription = description;
    
    // Find @[userId] patterns and replace with @userName
    const userIdMatches = description.match(/@\[[a-f0-9]{24}\]/g);
    if (!userIdMatches) return description;
    
    for (const match of userIdMatches) {
      const userId = match.substring(2, match.length - 1); // Remove @[ and ]
      const user = userMap.get(userId);
      if (user) {
        processedDescription = processedDescription.replace(match, `@${user.name}`);
      }
    }
    
    return processedDescription;
  }
}

export const insightCommentService = new InsightCommentService();
