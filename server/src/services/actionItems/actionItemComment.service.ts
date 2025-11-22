import { ActionItemCommentModel, IActionItemComment } from '../../schemas/actionItemComment.schema';
import { UserModel } from '../../schemas/user.schema';
import { ActionItemModel } from '../../schemas/actionItem.schema';
import mongoose from 'mongoose';

export interface ActionItemCommentInput {
  title?: string;
  description: string;
  actionItemId: string;
  taggedUserIds?: string[];
}

export interface ActionItemCommentResponse {
  _id: string;
  title?: string;
  description: string;
  actionItem: string;
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

export class ActionItemCommentService {
  /**
   * Parse tagged users from comment description
   * Format: @[userId]
   */
  private static parseTaggedUsers(description: string, taggedUserIds?: string[]): string[] {
    const taggedIds: string[] = [];
    
    // Extract user IDs from description in format @[userId]
    const regex = /@\[(\w+)\]/g;
    let match;
    while ((match = regex.exec(description)) !== null) {
      taggedIds.push(match[1]);
    }
    
    // Also add explicitly provided tagged user IDs
    if (taggedUserIds) {
      taggedIds.push(...taggedUserIds);
    }
    
    // Remove duplicates
    return Array.from(new Set(taggedIds));
  }

  /**
   * Convert an array of string IDs into ObjectId instances
   */
  private static toObjectIdArray(ids: string[]): mongoose.Types.ObjectId[] {
    return ids
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
  }

  /**
   * Replace user IDs with names in comment description
   * Format: @[userId] -> User Name
   */
  private static async replaceIdsWithNames(description: string): Promise<string> {
    const regex = /@\[(\w+)\]/g;
    let processedDescription = description;
    const matches = Array.from(description.matchAll(regex));
    
    for (const match of matches) {
      const userId = match[1];
      try {
        const user = await UserModel.findById(userId).select('firstName lastName email');
        if (user) {
          const userName = `${user.firstName} ${user.lastName}`;
          processedDescription = processedDescription.replace(`@[${userId}]`, userName);
        }
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
      }
    }
    
    return processedDescription;
  }

  /**
   * Create a new comment for an action item
   */
  static async createComment(
    input: ActionItemCommentInput,
    createdBy: string,
    organizationId: string
  ): Promise<ActionItemCommentResponse> {
    try {
      // Verify the action item exists and belongs to the organization
      const actionItem = await ActionItemModel.findOne({
        _id: input.actionItemId,
        organizationId: organizationId
      });

      if (!actionItem) {
        throw new Error('Action item not found or does not belong to the organization');
      }

      // Get the next index for this action item
      const lastComment = await ActionItemCommentModel.findOne({ actionItem: input.actionItemId })
        .sort({ index: -1 })
        .select('index');
      const nextIndex = lastComment ? lastComment.index + 1 : 1;

      // Parse tagged users from description and explicit taggedUserIds
      const taggedUsers = this.toObjectIdArray(
        this.parseTaggedUsers(input.description, input.taggedUserIds)
      );

      // Create the comment
      const comment = new ActionItemCommentModel({
        title: input.title,
        description: input.description,
        actionItem: input.actionItemId,
        taggedUsers,
        index: nextIndex,
        createdBy
      });

      await comment.save();

      // Populate and return the comment
      return await this.getCommentById((comment._id as any).toString());
    } catch (error) {
      console.error('Error creating action item comment:', error);
      throw error;
    }
  }

  /**
   * Get all comments for an action item
   */
  static async getCommentsByActionItem(actionItemId: string): Promise<ActionItemCommentResponse[]> {
    try {
      const comments = await ActionItemCommentModel.find({ actionItem: actionItemId })
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email')
        .sort({ index: 1 })
        .lean();

      return comments.map(comment => ({
        _id: (comment._id as any).toString(),
        title: comment.title,
        description: comment.description,
        actionItem: comment.actionItem.toString(),
        taggedUsers: comment.taggedUsers.map((user: any) => ({
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
      }));
    } catch (error) {
      console.error('Error fetching action item comments:', error);
      throw error;
    }
  }

  /**
   * Get a single comment by ID
   */
  static async getCommentById(commentId: string): Promise<ActionItemCommentResponse> {
    try {
      const comment = await ActionItemCommentModel.findById(commentId)
        .populate('createdBy', 'firstName lastName email')
        .populate('taggedUsers', 'firstName lastName email')
        .lean();

      if (!comment) {
        throw new Error('Comment not found');
      }

      return {
        _id: (comment._id as any).toString(),
        title: comment.title,
        description: comment.description,
        actionItem: comment.actionItem.toString(),
        taggedUsers: comment.taggedUsers.map((user: any) => ({
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
      console.error('Error fetching action item comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(commentId: string, updates: Partial<ActionItemCommentInput>, organizationId: string): Promise<ActionItemCommentResponse> {
    try {
      const comment = await ActionItemCommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Verify the action item belongs to the organization
      const actionItem = await ActionItemModel.findById(comment.actionItem);
      if (!actionItem || actionItem.organizationId.toString() !== organizationId) {
        throw new Error('Action item not found or does not belong to the organization');
      }

      // Parse tagged users if description is being updated
      if (updates.description) {
        const taggedUsers = this.toObjectIdArray(
          this.parseTaggedUsers(updates.description, updates.taggedUserIds)
        );
        comment.description = updates.description;
        comment.taggedUsers = taggedUsers;
      }

      if (updates.title !== undefined) {
        comment.title = updates.title;
      }

      await comment.save();

      return await this.getCommentById(commentId);
    } catch (error) {
      console.error('Error updating action item comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string, organizationId: string): Promise<void> {
    try {
      const comment = await ActionItemCommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Verify the action item belongs to the organization
      const actionItem = await ActionItemModel.findById(comment.actionItem);
      if (!actionItem || actionItem.organizationId.toString() !== organizationId) {
        throw new Error('Action item not found or does not belong to the organization');
      }

      await ActionItemCommentModel.findByIdAndDelete(commentId);
    } catch (error) {
      console.error('Error deleting action item comment:', error);
      throw error;
    }
  }
}

