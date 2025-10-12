import React from 'react';
import { Box, Typography, Paper, Button, Avatar, Chip } from '@mui/material';
import { Comment } from '@mui/icons-material';
import { InsightCommentsProps } from '../shared/types';
import CommentDescriptionField from '../forms/CommentDescriptionField';
import { insightCommentService } from '@/services/insightCommentService';

const InsightComments: React.FC<InsightCommentsProps> = ({
  insight,
  comments,
  loadingComments,
  showAddComment,
  setShowAddComment,
  newComment,
  setNewComment,
  creatingComment,
  setCreatingComment,
  users,
  onCommentCreated
}) => {
  if (!insight) return null;

  const renderCommentDescription = (description: string, taggedUsers: any[]) => {
    if (!description) return '';
    
    // Convert user IDs to names for display using the service helper
    const userMap = new Map<string, { name: string; email: string }>();
    users.forEach(user => {
      userMap.set(user._id, {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });
    });
    
    // Use the service helper to replace user IDs with names
    const processedDescription = insightCommentService.replaceUserIdsWithNames(description, userMap);
    
    return processedDescription;
  };

  const handleAddComment = async () => {
    if (!insight?.id || !newComment.description.trim()) return;
    
    setCreatingComment(true);
    try {
      // Create a map of user names to user IDs
      const userNameToIdMap = new Map<string, string>();
      users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        userNameToIdMap.set(fullName, user._id);
      });
      
      // Replace user names with user IDs in the description
      const processedDescription = insightCommentService.replaceUserNamesWithIds(
        newComment.description,
        userNameToIdMap
      );
      
      // Extract tagged user IDs from the processed description
      const taggedUserIds = insightCommentService.parseTaggedUsers(processedDescription);
      
      const commentData = {
        insightId: insight.id,
        title: newComment.title || 'Comment',
        description: processedDescription,
        taggedUserIds: taggedUserIds
      };
      
      // Call the comment service to create the comment
      await insightCommentService.createComment(commentData);
      
      setNewComment({ title: '', description: '' });
      setShowAddComment(false);
      onCommentCreated();
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setCreatingComment(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Comment sx={{ fontSize: 20 }} />
          Comments ({comments?.length || 0})
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowAddComment(!showAddComment)}
          sx={{ textTransform: 'none' }}
        >
          {showAddComment ? 'Cancel' : 'Add Comment'}
        </Button>
      </Box>

      {/* Add Comment Form */}
      {showAddComment && (
        <Paper sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb' }}>
          <CommentDescriptionField
            value={newComment.description}
            onChange={(value) => setNewComment({ ...newComment, description: value })}
            users={users}
            placeholder="Add a comment... (use @[name] to mention users)"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowAddComment(false);
                setNewComment({ title: '', description: '' });
              }}
              disabled={creatingComment}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleAddComment}
              disabled={creatingComment || !newComment.description.trim()}
            >
              {creatingComment ? 'Adding...' : 'Add Comment'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Comments List */}
      <Paper sx={{ border: '1px solid #e5e7eb' }}>
        {loadingComments ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading comments...
            </Typography>
          </Box>
        ) : !comments || comments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No comments yet. Be the first to add one!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {comments.map((comment) => (
              <Box key={comment._id} sx={{ mb: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1, backgroundColor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {new Date(comment.createdAt).toISOString().split('T')[0]} {new Date(comment.createdAt).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1, lineHeight: 1.5, fontSize: '0.875rem' }}>
                  {renderCommentDescription(comment.description, comment.taggedUsers || [])}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                      {comment.createdBy.firstName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                      {comment.createdBy.firstName} {comment.createdBy.lastName}
                    </Typography>
                  </Box>
                  {comment.taggedUsers.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {comment.taggedUsers.map((user) => (
                        <Chip 
                          key={user._id}
                          label={`${user.firstName} ${user.lastName}`}
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 20 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default InsightComments;
