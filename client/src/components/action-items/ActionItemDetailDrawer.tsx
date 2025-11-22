import React, { useState, useEffect } from 'react';
import { Drawer, Box, Divider, Typography, IconButton, Link } from '@mui/material';
import { Close } from '@mui/icons-material';
import { IActionItem } from '@/services/action-items-service';
import AssigneeSelector from '../insights/forms/AssigneeSelector';
import StatusSelector from '../insights/filters/StatusSelector';
import { insightsService } from '@/services/insights-service';

interface ActionItemDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  actionItem: IActionItem | null;
  users: Array<{ _id: string; name: string; email: string }>;
  onActionItemUpdate?: (actionItemId: string, updates: Partial<IActionItem>) => void;
}

const ActionItemDetailDrawer: React.FC<ActionItemDetailDrawerProps> = ({
  open,
  onClose,
  actionItem,
  users,
  onActionItemUpdate
}) => {
  const [updating, setUpdating] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Fetch insight when action item changes
  useEffect(() => {
    const fetchInsight = async () => {
      if (!actionItem?.insightId) {
        setInsight(null);
        return;
      }

      setLoadingInsight(true);
      try {
        // Extract the insight ID - handle both populated object and string ID
        let insightId: string;
        if (typeof actionItem.insightId === 'object' && actionItem.insightId !== null) {
          // Insight is populated from the server
          const populatedInsight = actionItem.insightId as any;
          insightId = populatedInsight._id || populatedInsight.id || String(populatedInsight);
          
          // If we have the populated insight data, we can use that directly
          if (populatedInsight.issueDescription || populatedInsight.message) {
            setInsight(populatedInsight);
            setLoadingInsight(false);
            return;
          }
        } else {
          // Insight is just an ID string
          insightId = String(actionItem.insightId);
        }

        // Fetch all insights and find the matching one
        const response = await insightsService.getInsightsByOrganization();
        
        // Try to find by _id or id
        const foundInsight = response.data?.find(i => 
          String(i._id) === insightId || 
          String(i.id) === insightId
        );
        
        setInsight(foundInsight);
      } catch (error) {
        console.error('Failed to fetch insight:', error);
        setInsight(null);
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchInsight();
  }, [actionItem?.insightId]);

  if (!actionItem) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!actionItem?._id || !onActionItemUpdate) return;
    
    setUpdating(true);
    try {
      await onActionItemUpdate(actionItem._id, { status: newStatus as IActionItem['status'] });
    } catch (error) {
      console.error('Failed to update action item status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssigneeChange = async (userId: string | null) => {
    if (!actionItem?._id || !onActionItemUpdate) return;
    
    setUpdating(true);
    try {
      await onActionItemUpdate(actionItem._id, { assignee: userId || undefined });
    } catch (error) {
      console.error('Failed to update action item assignee:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '600px', md: '700px' },
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
              {actionItem.title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Meta Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Action Item Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3 }}>
            {/* Assignee */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Assignee:
              </Typography>
              <AssigneeSelector
                assignee={actionItem.assignee}
                users={users}
                onAssigneeChange={handleAssigneeChange}
                size="small"
                disabled={updating}
                updating={updating}
              />
            </Box>

            {/* Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Status:
              </Typography>
              <StatusSelector
                status={actionItem.status || 'new'}
                onStatusChange={handleStatusChange}
                disabled={updating}
                hasPermission={true}
                updating={updating}
              />
            </Box>

            {/* Priority */}
            {actionItem.priority && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Priority:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {actionItem.priority}
                </Typography>
              </Box>
            )}

            {/* Severity */}
            {actionItem.severity && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Severity:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                  {actionItem.severity}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Description
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
            {actionItem.description}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Dates */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Timeline
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {actionItem.createdAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 80 }}>
                  Created:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formatDate(actionItem.createdAt)}
                </Typography>
              </Box>
            )}
            {actionItem.updatedAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 80 }}>
                  Updated:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formatDate(actionItem.updatedAt)}
                </Typography>
              </Box>
            )}
            {actionItem.dueDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 80 }}>
                  Due Date:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formatDate(actionItem.dueDate)}
                </Typography>
              </Box>
            )}
            {actionItem.completedAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', minWidth: 80 }}>
                  Completed:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {formatDate(actionItem.completedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Related Insight */}
        {loadingInsight && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Related Insight
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Loading insight...
              </Typography>
            </Box>
          </>
        )}
        {!loadingInsight && insight && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Related Insight
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'rgba(102, 126, 234, 0.05)', borderRadius: 2, border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {insight.message || insight.issueDescription || JSON.stringify(insight)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1.5, mb: 1 }}>
                  {insight.severity && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Severity: <strong>{insight.severity}</strong>
                    </Typography>
                  )}
                  {insight.category && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Category: <strong>{insight.category}</strong>
                    </Typography>
                  )}
                  {insight.insightType && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Type: <strong>{insight.insightType}</strong>
                    </Typography>
                  )}
                </Box>

                {insight.customerName && (
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                    Customer: {insight.customerName}
                  </Typography>
                )}

                {/* Show guidance if available */}
                {insight.meta?.guidance?.summary && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Insight Summary:
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                      {insight.meta.guidance.summary}
                    </Typography>
                  </Box>
                )}

                {/* Show guidance actions if available */}
                {insight.meta?.guidance?.actions && insight.meta.guidance.actions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Recommended Actions:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {insight.meta.guidance.actions.slice(0, 3).map((action: any, idx: number) => (
                        <li key={idx}>
                          <Typography variant="caption" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                            {typeof action === 'string' ? action : action.description || action}
                          </Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}

        {/* Tags */}
        {actionItem.tags && actionItem.tags.length > 0 && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {actionItem.tags.map((tag, index) => (
                  <Typography 
                    key={index} 
                    variant="caption" 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                      borderRadius: 1,
                      color: 'text.secondary'
                    }}
                  >
                    {tag}
                  </Typography>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default ActionItemDetailDrawer;

