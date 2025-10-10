import express from 'express';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';
import { InsightCommentService, InsightCommentInput } from '../../../services/insights/insightComment.service';
import { 
  createInsightCommentSchema, 
  updateInsightCommentSchema,
  insightIdParamSchema,
  commentIdParamSchema,
  userIdParamSchema,
  insightNumberParamSchema
} from './validations';
import { validateRequest, validateRequestParams } from '../../../middleware/validateRequest';

const router = express.Router();

/**
 * POST /insights/:insightId/comment
 * Create a new comment for an insight
 */
router.post(
  '/:insightId/comment',
  authenticateJWT,
  hasPermission('insights:write'),
  validateRequestParams({ insightId: insightIdParamSchema }),
  validateRequest(createInsightCommentSchema),
  async (req, res) => {
  console.log('[POST /:insightId/comment] Route hit! InsightId:', req.params.insightId);
  try {
    const userId = req.user?._id;
    if (!userId) {
      console.log('[POST /:insightId/comment] No userId found in req.user');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { insightId } = req.params;
    console.log('[POST /:insightId/comment] Creating comment for insight:', insightId, 'by user:', userId);
    const commentInput: InsightCommentInput = {
      ...req.body,
      insightId
    };
    
    const comment = await InsightCommentService.createComment(commentInput, userId.toString());
    console.log('[POST /:insightId/comment] Comment created successfully:', comment._id);
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('[POST /:insightId/comment] Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * GET /insights/:insightId/comments
 * Get all comments for an insight
 */
router.get(
  '/:insightId/comments',
  authenticateJWT,
  hasPermission('insights:read'),
  validateRequestParams({ insightId: insightIdParamSchema }),
  async (req, res) => {
  try {
    const { insightId } = req.params;
    
    const comments = await InsightCommentService.getCommentsByInsight(insightId);
    
    res.json(comments);
  } catch (error) {
    console.error('Error getting comments by insight:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * GET /insights/:insightId/comments/:commentId
 * Get a single comment by ID for a specific insight
 */
router.get(
  '/:insightId/comments/:commentId',
  authenticateJWT,
  hasPermission('insights:read'),
  validateRequestParams({ insightId: insightIdParamSchema, commentId: commentIdParamSchema }),
  async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await InsightCommentService.getCommentById(commentId);
    
    res.json(comment);
  } catch (error) {
    console.error('Error getting comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(500).json({ error: 'Failed to get comment' });
  }
});

/**
 * PUT /insights/:insightId/comments/:commentId
 * Update a comment
 */
router.put(
  '/:insightId/comments/:commentId',
  authenticateJWT,
  hasPermission('insights:write'),
  validateRequestParams({ insightId: insightIdParamSchema, commentId: commentIdParamSchema }),
  validateRequest(updateInsightCommentSchema),
  async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { commentId } = req.params;
    const comment = await InsightCommentService.updateComment(commentId, req.body, userId.toString());
    
    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (error instanceof Error && error.message === 'Unauthorized to update this comment') {
      return res.status(403).json({ error: 'Unauthorized to update this comment' });
    }
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/**
 * DELETE /insights/:insightId/comments/:commentId
 * Delete a comment
 */
router.delete(
  '/:insightId/comments/:commentId',
  authenticateJWT,
  hasPermission('insights:write'),
  validateRequestParams({ insightId: insightIdParamSchema, commentId: commentIdParamSchema }),
  async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { commentId } = req.params;
    
    await InsightCommentService.deleteComment(commentId, userId.toString());
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error instanceof Error && error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (error instanceof Error && error.message === 'Unauthorized to delete this comment') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

/**
 * GET /insights/insight-number/:insightNumber/comments
 * Get comments by insight number
 */
router.get(
  '/insight-number/:insightNumber/comments',
  authenticateJWT,
  hasPermission('insights:read'),
  validateRequestParams({ insightNumber: insightNumberParamSchema }),
  async (req, res) => {
  try {
    const { insightNumber } = req.params;
    
    const comments = await InsightCommentService.getCommentsByInsightNumber(insightNumber);
    
    res.json(comments);
  } catch (error) {
    console.error('Error getting comments by insight number:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * GET /insights/tagged/:userId/comments
 * Get comments where a user is tagged
 */
router.get(
  '/tagged/:userId/comments',
  authenticateJWT,
  hasPermission('insights:read'),
  validateRequestParams({ userId: userIdParamSchema }),
  async (req, res) => {
  try {
    const { userId } = req.params;
    
    const comments = await InsightCommentService.getCommentsByTaggedUser(userId);
    
    res.json(comments);
  } catch (error) {
    console.error('Error getting comments by tagged user:', error);
    res.status(500).json({ error: 'Failed to get tagged comments' });
  }
});

export default router;
