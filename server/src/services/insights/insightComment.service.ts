import { InsightCommentModel, IInsightComment } from '../../schemas/insightComment.schema';
import { UserModel } from '../../schemas/user.schema';
import { InsightModel } from '../../schemas/insights.schema';
import mongoose from 'mongoose';

export interface InsightCommentInput {
  title?: string;
  description: string;
  insightId: string;
  taggedUserIds?: string[];
}

export interface InsightCommentResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export class InsightCommentService {
  /**
   * Parse tagged users from comment description
   * Format: @[userId]
   */
  private static parseTaggedUsers(description: string, taggedUserIds: string[] = []): string[] {
    const taggedUsers: string[] = [...taggedUserIds];
    
    // Find @[userId] patterns in description
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
   * Replace user names with user IDs in description for storage
   * Format: @userName -> @[userId]
   */
  private static async replaceUserNamesWithIds(description: string): Promise<string> {
    // Find @userName patterns and replace with @[userId]
    const userNameMatches = description.match(/@[a-zA-Z0-9._-]+/g);
    if (!userNameMatches) return description;

    let processedDescription = description;
    
    for (const match of userNameMatches) {
      const userName = match.substring(1); // Remove @
      
      // Skip if it's already in the @[userId] format
      if (/^\[[a-f0-9]{24}\]$/.test(userName)) continue;
      
      try {
        const user = await UserModel.findOne({ 
          $or: [
            { fullName: { $regex: new RegExp(`^${userName}$`, 'i') } },
            { firstName: { $regex: new RegExp(`^${userName}$`, 'i') } },
            { lastName: { $regex: new RegExp(`^${userName}$`, 'i') } },
            { email: { $regex: new RegExp(`^${userName}$`, 'i') } }
          ]
        }).select('_id fullName firstName lastName');
        
        if (user) {
          processedDescription = processedDescription.replace(match, `@[${user._id.toString()}]`);
        }
      } catch (error) {
        console.error('Error replacing user name with ID:', error);
      }
    }
    
    return processedDescription;
  }

  /**
   * Replace user IDs with user names in description for display
   * Format: @[userId] -> @userName
   */
  private static async replaceUserIdsWithNames(description: string): Promise<string> {
    // Find @[userId] patterns and replace with @userName
    const userIdMatches = description.match(/@\[[a-f0-9]{24}\]/g);
    if (!userIdMatches) return description;

    let processedDescription = description;
    
    for (const match of userIdMatches) {
      const userId = match.substring(2, match.length - 1); // Remove @[ and ]
      
      try {
        const user = await UserModel.findById(userId).select('fullName firstName lastName');
        if (user) {
          const displayName = (user as any).fullName || `${(user as any).firstName} ${(user as any).lastName}`.trim();
          if (displayName) {
            processedDescription = processedDescription.replace(match, `@${displayName}`);
          }
        }
      } catch (error) {
        console.error('Error replacing user ID with name:', error);
      }
    }
    
    return processedDescription;
  }

  /**
   * Create a new comment for an insight
   */
  static async createComment(
    input: InsightCommentInput,
    createdBy: string
  ): Promise<InsightCommentResponse> {
    try {
      console.log('Creating comment with input:', input);
      
      // Get the insight to retrieve insightNumber
      const insight = await InsightModel.findById(input.insightId).select('insightNumber');
      if (!insight) {
        throw new Error('Insight not found');
      }

      // Get the next index for this insight
      const lastComment = await InsightCommentModel.findOne({ insight: input.insightId })
        .sort({ index: -1 })
        .select('index');
      const nextIndex = lastComment ? lastComment.index + 1 : 1;

      // Since frontend already processed the description, we can use it directly
      // Only run replaceUserNamesWithIds if the description contains user names (not @[userId] format)
      const needsProcessing = !input.description.includes('@[');
      const processedDescription = needsProcessing 
        ? await this.replaceUserNamesWithIds(input.description)
        : input.description;
      console.log('Backend processed description:', processedDescription);
      
      // Parse tagged users from description and explicit taggedUserIds
      const taggedUsers = this.parseTaggedUsers(processedDescription, input.taggedUserIds);
      console.log('Backend tagged users:', taggedUsers);

      // Create the comment
      const comment = new InsightCommentModel({
        title: input.title,
        description: processedDescription,
        insight: input.insightId,
        insightNumber: insight.insightNumber,
        taggedUsers,
        index: nextIndex,
        createdBy
      });

      console.log('Saving comment with taggedUsers:', taggedUsers);
      await comment.save();

      // Populate and return the comment
      return await this.getCommentById((comment._id as any).toString());
    } catch (error) {
      console.error('Error creating insight comment:', error);
      throw error;
    }
  }

  /**
   * Get all comments for an insight
   */
  static async getCommentsByInsight(insightId: string): Promise<InsightCommentResponse[]> {
    try {
      const comments = await InsightCommentModel.find({ insight: insightId })
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email')
        .sort({ index: 1 });

      // Keep the original description with @[userId] format for frontend to handle
      const processedComments = await Promise.all(
        comments.map(async (comment) => {
          // Don't process the description here - let frontend handle the display
          const processedDescription = comment.description;
          
          return {
            _id: (comment._id as any).toString(),
            title: comment.title,
            description: processedDescription,
            insight: comment.insight.toString(),
            insightNumber: comment.insightNumber,
            taggedUsers: (comment.taggedUsers as any[]).map((user: any) => ({
              _id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            })),
            index: comment.index,
            createdBy: {
              _id: (comment.createdBy as any)._id.toString(),
              firstName: (comment.createdBy as any).firstName,
              lastName: (comment.createdBy as any).lastName,
              email: (comment.createdBy as any).email
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          };
        })
      );

      return processedComments;
    } catch (error) {
      console.error('Error getting comments by insight:', error);
      throw error;
    }
  }

  /**
   * Get comments by insight number
   */
  static async getCommentsByInsightNumber(insightNumber: string): Promise<InsightCommentResponse[]> {
    try {
      const comments = await InsightCommentModel.find({ insightNumber })
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email')
        .sort({ index: 1 });

      // Keep the original description with @[userId] format for frontend to handle
      const processedComments = await Promise.all(
        comments.map(async (comment) => {
          // Don't process the description here - let frontend handle the display
          const processedDescription = comment.description;
          
          return {
            _id: (comment._id as any).toString(),
            title: comment.title,
            description: processedDescription,
            insight: comment.insight.toString(),
            insightNumber: comment.insightNumber,
            taggedUsers: (comment.taggedUsers as any[]).map((user: any) => ({
              _id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            })),
            index: comment.index,
            createdBy: {
              _id: (comment.createdBy as any)._id.toString(),
              firstName: (comment.createdBy as any).firstName,
              lastName: (comment.createdBy as any).lastName,
              email: (comment.createdBy as any).email
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          };
        })
      );

      return processedComments;
    } catch (error) {
      console.error('Error getting comments by insight number:', error);
      throw error;
    }
  }

  /**
   * Get a single comment by ID
   */
  static async getCommentById(commentId: string): Promise<InsightCommentResponse> {
    try {
      const comment = await InsightCommentModel.findById(commentId)
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email');

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Keep the original description with @[userId] format for frontend to handle
      const processedDescription = comment.description;

      return {
        _id: (comment._id as any).toString(),
        title: comment.title,
        description: processedDescription,
        insight: comment.insight.toString(),
        insightNumber: comment.insightNumber,
        taggedUsers: (comment.taggedUsers as any[]).map((user: any) => ({
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        })),
        index: comment.index,
        createdBy: {
          _id: (comment.createdBy as any)._id.toString(),
          firstName: (comment.createdBy as any).firstName,
          lastName: (comment.createdBy as any).lastName,
          email: (comment.createdBy as any).email
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      };
    } catch (error) {
      console.error('Error getting comment by ID:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    commentId: string,
    updates: Partial<InsightCommentInput>,
    updatedBy: string
  ): Promise<InsightCommentResponse> {
    try {
      const comment = await InsightCommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user has permission to update (created by same user or admin)
      if (comment.createdBy.toString() !== updatedBy) {
        throw new Error('Unauthorized to update this comment');
      }

      const updateData: any = {};

      if (updates.title) {
        updateData.title = updates.title;
      }

      if (updates.description) {
        // Process description to replace user names with IDs
        updateData.description = await this.replaceUserNamesWithIds(updates.description);
        
        // Parse tagged users from updated description
        updateData.taggedUsers = this.parseTaggedUsers(updateData.description, updates.taggedUserIds);
      }

      if (updates.taggedUserIds) {
        updateData.taggedUsers = updates.taggedUserIds;
      }

      const updatedComment = await InsightCommentModel.findByIdAndUpdate(
        commentId,
        updateData,
        { new: true }
      ).populate('createdBy', 'name email').populate('taggedUsers', 'name email');

      if (!updatedComment) {
        throw new Error('Failed to update comment');
      }

      // Keep the original description with @[userId] format for frontend to handle
      const processedDescription = updatedComment.description;

      return {
        _id: (updatedComment._id as any).toString(),
        title: updatedComment.title,
        description: processedDescription,
        insight: updatedComment.insight.toString(),
        insightNumber: updatedComment.insightNumber,
        taggedUsers: (updatedComment.taggedUsers as any[]).map((user: any) => ({
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        })),
        index: updatedComment.index,
        createdBy: {
          _id: (updatedComment.createdBy as any)._id.toString(),
              firstName: (updatedComment.createdBy as any).firstName,
              lastName: (updatedComment.createdBy as any).lastName,
          email: (updatedComment.createdBy as any).email
        },
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string, deletedBy: string): Promise<boolean> {
    try {
      const comment = await InsightCommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user has permission to delete (created by same user or admin)
      if (comment.createdBy.toString() !== deletedBy) {
        throw new Error('Unauthorized to delete this comment');
      }

      await InsightCommentModel.findByIdAndDelete(commentId);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get comments where a user is tagged
   */
  static async getCommentsByTaggedUser(userId: string): Promise<InsightCommentResponse[]> {
    try {
      const comments = await InsightCommentModel.find({ taggedUsers: userId })
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email')
        .sort({ createdAt: -1 });

      // Keep the original description with @[userId] format for frontend to handle
      const processedComments = await Promise.all(
        comments.map(async (comment) => {
          // Don't process the description here - let frontend handle the display
          const processedDescription = comment.description;
          
          return {
            _id: (comment._id as any).toString(),
            title: comment.title,
            description: processedDescription,
            insight: comment.insight.toString(),
            insightNumber: comment.insightNumber,
            taggedUsers: (comment.taggedUsers as any[]).map((user: any) => ({
              _id: user._id.toString(),
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            })),
            index: comment.index,
            createdBy: {
              _id: (comment.createdBy as any)._id.toString(),
              firstName: (comment.createdBy as any).firstName,
              lastName: (comment.createdBy as any).lastName,
              email: (comment.createdBy as any).email
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          };
        })
      );

      return processedComments;
    } catch (error) {
      console.error('Error getting comments by tagged user:', error);
      throw error;
    }
  }
}
