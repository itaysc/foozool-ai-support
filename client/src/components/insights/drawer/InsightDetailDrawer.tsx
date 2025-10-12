import React, { useState, useEffect } from 'react';
import { Drawer, Box, Divider } from '@mui/material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { insightsService } from '@/services/insights-service';
import { insightCommentService, InsightComment } from '@/services/insightCommentService';
import InsightHeader from './InsightHeader';
import InsightMetaInfo from './InsightMetaInfo';
import InsightGuidance from './InsightGuidance';
import InsightEvidence from './InsightEvidence';
import InsightComments from './InsightComments';
import InsightActions from './InsightActions';

interface InsightDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  insight: CustomerSuccessInsight | null;
  onInsightUpdate?: (insightId: string, updates: Partial<CustomerSuccessInsight>) => void;
}

const InsightDetailDrawer: React.FC<InsightDetailDrawerProps> = ({
  open,
  onClose,
  insight,
  onInsightUpdate
}) => {
  const [users, setUsers] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string; name: string }>>([]);
  const [updating, setUpdating] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<InsightComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState({ title: '', description: '' });
  const [creatingComment, setCreatingComment] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await insightsService.getUsers();
        if (response.success) {
          const formattedUsers = response.data.map(user => ({
            _id: user._id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
          }));
          setUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      // Clear comment form when drawer closes
      setShowAddComment(false);
      setNewComment({ title: '', description: '' });
    }
  }, [open]);

  // Fetch comments when insight changes
  useEffect(() => {
    if (insight?.id) {
      fetchComments();
    }
  }, [insight?.id]);

  const fetchComments = async () => {
    if (!insight?.id) return;
    
    setLoadingComments(true);
    try {
      const response = await insightCommentService.getCommentsByInsight(insight.id);
      setComments(response);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentCreated = () => {
    fetchComments();
  };

  const handleInsightUpdate = async (insightId: string, updates: Partial<CustomerSuccessInsight>) => {
    if (!onInsightUpdate) return;
    
    try {
      await onInsightUpdate(insightId, updates);
    } catch (error) {
      console.error('Failed to update insight:', error);
      throw error;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '600px', md: '700px' },
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <InsightHeader 
          insight={insight} 
          onClose={onClose} 
        />

        <Divider sx={{ mb: 3 }} />

        {/* Meta Information */}
        <InsightMetaInfo
          insight={insight}
          onInsightUpdate={handleInsightUpdate}
          users={users}
          updating={updating}
          setUpdating={setUpdating}
        />

        <Divider sx={{ mb: 3 }} />

        {/* Guidance */}
        <InsightGuidance insight={insight} />

        <Divider sx={{ mb: 3 }} />

        {/* Evidence */}
        <InsightEvidence insight={insight} />

        <Divider sx={{ mb: 3 }} />

        {/* Comments */}
        <InsightComments
          insight={insight}
          comments={comments}
          loadingComments={loadingComments}
          showAddComment={showAddComment}
          setShowAddComment={setShowAddComment}
          newComment={newComment}
          setNewComment={setNewComment}
          creatingComment={creatingComment}
          setCreatingComment={setCreatingComment}
          users={users}
          onCommentCreated={handleCommentCreated}
        />

        {/* Action Buttons */}
        <InsightActions insight={insight} />
      </Box>
    </Drawer>
  );
};

export default InsightDetailDrawer;