import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  alpha,
  Paper,
  Slide,
  Popper,
  ClickAwayListener
} from '@mui/material';
import { 
  Close, 
  TrendingUp, 
  People, 
  School, 
  Email,
  Schedule,
  Download,
  Check,
  FiberManualRecord,
  PlayArrow,
  CheckCircle,
  Cancel,
  Refresh
} from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { insightsService } from '@/services/insights-service';
import { insightCommentService, InsightComment, CreateCommentInput } from '@/services/insightCommentService';
import CommentDescriptionField from './CommentDescriptionField';
import AssigneeSelector from './AssigneeSelector';

interface InsightDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  insight: CustomerSuccessInsight | null;
  onInsightUpdate?: (insightId: string, updates: Partial<CustomerSuccessInsight>) => void;
}

// Helper functions for link styling
const getLinkColor = (type: string): string => {
  switch (type) {
    case 'log': return '#dc2626';
    case 'dashboard': return '#059669';
    case 'documentation': return '#2563eb';
    case 'ticket': return '#7c3aed';
    case 'system': return '#ea580c';
    default: return '#6b7280';
  }
};

const getChipColor = (type: string): string => {
  switch (type) {
    case 'log': return '#fef2f2';
    case 'dashboard': return '#f0fdf4';
    case 'documentation': return '#eff6ff';
    case 'ticket': return '#faf5ff';
    case 'system': return '#fff7ed';
    default: return '#f9fafb';
  }
};

const getChipTextColor = (type: string): string => {
  switch (type) {
    case 'log': return '#dc2626';
    case 'dashboard': return '#059669';
    case 'documentation': return '#2563eb';
    case 'ticket': return '#7c3aed';
    case 'system': return '#ea580c';
    default: return '#6b7280';
  }
};

const InsightDetailDrawer: React.FC<InsightDetailDrawerProps> = ({
  open,
  onClose,
  insight,
  onInsightUpdate
}) => {
  const [users, setUsers] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string; name: string }>>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
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

  // Reset assignee dropdown state when drawer closes
  useEffect(() => {
    if (!open) {
      setStatusDropdownOpen(false);
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

  const convertUserIdsToNames = (description: string, users: any[]) => {
    if (!description || !users.length) return description;
    
    const userMap = new Map<string, { name: string; email: string }>();
    users.forEach(user => {
      userMap.set(user._id, {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      });
    });
    
    return insightCommentService.replaceUserIdsWithNames(description, userMap);
  };

  const fetchComments = async () => {
    if (!insight?.id) return;
    
    setLoadingComments(true);
    try {
      const commentsData = await insightCommentService.getCommentsByInsight(insight.id);
      
      // Convert @[userId] to user names for display
      const displayComments = (commentsData || []).map(comment => ({
        ...comment,
        description: convertUserIdsToNames(comment.description, users)
      }));
      
      setComments(displayComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreateComment = async () => {
    if (!insight?.id || !newComment.description.trim()) return;
    
    setCreatingComment(true);
    try {
      // Create user map for name/ID conversion
      const userMap = new Map<string, string>();
      users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        userMap.set(fullName, user._id);
        userMap.set(user.email, user._id);
        // Also add individual names for partial matching
        userMap.set(user.firstName, user._id);
        userMap.set(user.lastName, user._id);
      });

      console.log('Original description:', newComment.description);
      console.log('User map:', Array.from(userMap.entries()));

      // Replace user names with IDs in description
      const processedDescription = insightCommentService.replaceUserNamesWithIds(newComment.description, userMap);
      
      console.log('Processed description:', processedDescription);
      
      const taggedUserIds = insightCommentService.parseTaggedUsers(processedDescription);
      console.log('Tagged user IDs:', taggedUserIds);
      
      const commentInput: CreateCommentInput = {
        title: '', // No title required
        description: processedDescription,
        insightId: insight.id,
        taggedUserIds: taggedUserIds
      };

      console.log('Comment input:', commentInput);

      const createdComment = await insightCommentService.createComment(commentInput);
      
      // Convert @[userId] back to user names for display
      const displayComment = {
        ...createdComment,
        description: convertUserIdsToNames(createdComment.description, users)
      };
      
      setComments(prev => [...prev, displayComment]);
      setNewComment({ title: '', description: '' });
      setShowAddComment(false);
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setCreatingComment(false);
    }
  };

  if (!insight) return null;

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'red': 
        return {
          color: '#ef4444',
          bgColor: alpha('#ef4444', 0.1),
          label: 'Critical'
        };
      case 'yellow': 
        return {
          color: '#f59e0b',
          bgColor: alpha('#f59e0b', 0.1),
          label: 'Warning'
        };
      case 'info': 
        return {
          color: '#3b82f6',
          bgColor: alpha('#3b82f6', 0.1),
          label: 'Info'
        };
      default: 
        return {
          color: '#6b7280',
          bgColor: alpha('#6b7280', 0.1),
          label: 'Unknown'
        };
    }
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAffectedUsers = () => {
    const users = new Set<string>();
    if (insight.meta?.decliningUserIds) {
      insight.meta.decliningUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.anomalousUserIds) {
      insight.meta.anomalousUserIds.forEach((id: string) => users.add(id));
    }
    if (insight.meta?.powerUserIds) {
      insight.meta.powerUserIds.forEach((id: string) => users.add(id));
    }
    return Array.from(users);
  };


  // Function to render comment description with user mentions as badges
  const renderCommentDescription = (description: string, taggedUsers: any[]) => {
    if (!description) return '';
    
    // Create a more sophisticated approach to handle multi-word names
    // First, find all possible mentions by trying to match against tagged users
    let result = description;
    
    if (taggedUsers && taggedUsers.length > 0) {
      // Sort by name length (longest first) to match longer names before shorter ones
      const sortedUsers = [...taggedUsers].sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameB.length - nameA.length;
      });
      
      // Replace each user mention with a placeholder
      sortedUsers.forEach((user, userIndex) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const patterns = [
          `@[${user._id}]`, // New format: @[userId]
          `@${user._id}`,   // Old format: @userId (for backward compatibility)
          `@${fullName}`,
          `@${user.email}`,
          `@${user.firstName} ${user.lastName}`,
          `@${user.firstName}`,
          `@${user.lastName}`
        ];
        
        patterns.forEach(pattern => {
          const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          result = result.replace(regex, `__MENTION_${userIndex}__`);
        });
      });
      
      // Split by placeholders and reconstruct with badges
      const parts = result.split(/(__MENTION_\d+__)/g);
      
      return parts.map((part, index) => {
        const mentionMatch = part.match(/^__MENTION_(\d+)__$/);
        if (mentionMatch) {
          const userIndex = parseInt(mentionMatch[1]);
          const user = sortedUsers[userIndex];
          
          if (user) {
            return (
              <Chip
                key={index}
                label={`@${user.firstName} ${user.lastName}`}
                size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                backgroundColor: '#f5f5f5',
                color: '#666666',
                border: '1px solid #e0e0e0',
                mx: 0.5,
                display: 'inline-flex',
                verticalAlign: 'middle',
                '& .MuiChip-label': {
                  px: 1
                }
              }}
              />
            );
          }
        }
        return <span key={index}>{part}</span>;
      });
    }
    
    // Fallback: return original text if no tagged users
    return <span>{description}</span>;
  };

  const handleAssigneeChange = async (assigneeId: string | null) => {
    if (!insight.id || !onInsightUpdate) return;
    
    // Store original assignee for potential rollback
    const originalAssignee = insight.assignee;
    
    // Optimistically update the UI immediately
    const updates = { assignee: assigneeId || undefined };
    onInsightUpdate(insight.id, updates);
    
    setUpdating(true);
    try {
      await insightsService.updateInsightAssignee(insight.id, assigneeId);
    } catch (error) {
      console.error('Failed to update assignee:', error);
      // Revert the optimistic update on failure
      onInsightUpdate(insight.id, { assignee: originalAssignee });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!insight.id || !onInsightUpdate) return;
    
    // Store original status for potential rollback
    const originalStatus = insight.status;
    
    // Optimistically update the UI immediately
    onInsightUpdate(insight.id, { status: status as any });
    setStatusDropdownOpen(false);
    
    setUpdating(true);
    try {
      await insightsService.updateInsightStatus(insight.id, status);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert the optimistic update on failure
      onInsightUpdate(insight.id, { status: originalStatus as any });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { 
        label: 'New',
        color: '#6b7280', 
        bgColor: alpha('#6b7280', 0.1),
        icon: FiberManualRecord
      },
      in_progress: { 
        label: 'In Progress',
        color: '#3b82f6', 
        bgColor: alpha('#3b82f6', 0.1),
        icon: PlayArrow
      },
      resolved: { 
        label: 'Resolved',
        color: '#10b981', 
        bgColor: alpha('#10b981', 0.1),
        icon: CheckCircle
      },
      closed: { 
        label: 'Closed',
        color: '#6b7280', 
        bgColor: alpha('#6b7280', 0.1),
        icon: Cancel
      },
      reopened: { 
        label: 'Reopened',
        color: '#f59e0b', 
        bgColor: alpha('#f59e0b', 0.1),
        icon: Refresh
      }
    };
    return configs[status as keyof typeof configs] || configs.new;
  };

  const getStatusIcon = (statusKey: string) => {
    const config = getStatusConfig(statusKey);
    const IconComponent = config.icon;
    return <IconComponent sx={{ fontSize: 14 }} />;
  };

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'reopened', label: 'Reopened' }
  ];


  const affectedUsers = getAffectedUsers();
  const config = getSeverityConfig(insight.severity);
  const statusConfig = getStatusConfig(insight.status || 'new');

  const getActionButtons = () => {
    const buttons = [];
    
    if (insight.type.includes('trend') || insight.type.includes('decline')) {
      buttons.push(
        <Button 
          key="trend" 
          variant="contained" 
          startIcon={<TrendingUp />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          View Activity Trends
        </Button>
      );
    }
    
    if (insight.type.includes('user') || insight.type.includes('adoption')) {
      buttons.push(
        <Button 
          key="users" 
          variant="contained" 
          startIcon={<Email />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Contact Affected Users
        </Button>
      );
    }
    
    if (insight.type.includes('feature') || insight.type.includes('discovery')) {
      buttons.push(
        <Button 
          key="training" 
          variant="contained" 
          startIcon={<School />} 
          sx={{ 
            mr: 1, 
            mb: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Schedule Training Session
        </Button>
      );
    }
    
    buttons.push(
      <Button 
        key="export" 
        variant="outlined" 
        startIcon={<Download />} 
        sx={{ 
          mr: 1, 
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Export Data
      </Button>
    );
    
    buttons.push(
      <Button 
        key="alert" 
        variant="outlined" 
        startIcon={<Schedule />} 
        sx={{ 
          mr: 1, 
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Set Alert
      </Button>
    );
    
    return buttons;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      sx={{
        '& .MuiDrawer-paper': {
          width: 480,
          maxWidth: '90vw',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important'
        },
        '& .MuiBackdrop-root': {
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important'
        }
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {formatTypeName(insight.type)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Assignee Selector */}
              <AssigneeSelector
                assignee={insight.assignee}
                users={users}
                onAssigneeChange={handleAssigneeChange}
                size="medium"
                disabled={updating}
                updating={updating}
              />
              
              {/* Severity Badge */}
              <Chip 
                label={config.label}
                size="small"
                sx={{
                  backgroundColor: config.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  minWidth: 80,
                  width: 80,
                  justifyContent: 'center'
                }}
              />
              
              {/* Status Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                <Box 
                  data-status-selector
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    cursor: 'pointer',
                    opacity: updating ? 0.6 : 1,
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => !updating && setStatusDropdownOpen(!statusDropdownOpen)}
                >
                  <Chip 
                    label={statusConfig.label}
                    size="small"
                    icon={getStatusIcon(insight.status || 'new')}
                    sx={{
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      height: 20,
                      minWidth: 80,
                      width: 80,
                      justifyContent: 'center',
                      transition: 'all 0.2s ease-in-out',
                      '& .MuiChip-label': {
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        textOverflow: 'unset'
                      },
                      '& .MuiChip-icon': {
                        color: statusConfig.color,
                        fontSize: 14
                      }
                    }}
                  />
                </Box>
                
                {/* Status Dropdown */}
                <Popper
                  open={statusDropdownOpen}
                  anchorEl={document.querySelector('[data-status-selector]')}
                  placement="bottom-start"
                  style={{ zIndex: 1300 }}
                >
                  <ClickAwayListener onClickAway={() => setStatusDropdownOpen(false)}>
                    <Paper sx={{ 
                      mt: 1, 
                      minWidth: 200, 
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      borderRadius: 2
                    }}>
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {statusOptions.map((option) => {
                          const optionConfig = getStatusConfig(option.value);
                          const isSelected = insight.status === option.value;
                          return (
                            <Box
                              key={option.value}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                backgroundColor: isSelected ? alpha(optionConfig.color, 0.1) : 'transparent',
                                '&:hover': { 
                                  backgroundColor: isSelected ? alpha(optionConfig.color, 0.15) : alpha(optionConfig.color, 0.1) 
                                },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                              onClick={() => handleStatusChange(option.value)}
                            >
                              <Box sx={{ color: optionConfig.color }}>
                                {getStatusIcon(option.value)}
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? 600 : 500,
                                  color: optionConfig.color,
                                  flex: 1
                                }}
                              >
                                {optionConfig.label}
                              </Typography>
                              {isSelected && <Check sx={{ fontSize: 16, color: optionConfig.color }} />}
                            </Box>
                          );
                        })}
                      </Box>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Insight Description */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: config.color }}>
              INSIGHT
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {insight.message}
            </Typography>
          </Paper>

          {/* Recommended Action */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: alpha('#10b981', 0.05) }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#10b981' }}>
              GUIDANCE
            </Typography>
            {(() => {
              const guidance: any = (insight as any)?.meta?.guidance || null;
              if (!guidance) {
                return (
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    Guidance is being prepared for this insight.
                  </Typography>
                );
              }

              return (
                <Box>
                  {guidance.summary && (
                    <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1.5 }}>
                      {guidance.summary}
                    </Typography>
                  )}
                  <List dense>
                    {guidance.why && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Why this matters"
                          secondary={guidance.why}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.signals && Array.isArray(guidance.signals) && guidance.signals.length > 0 && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Signals / Evidence"
                          secondary={
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                              {guidance.signals.map((s: string, i: number) => (
                                <li key={i}><Typography variant="body2">{s}</Typography></li>
                              ))}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.actions && Array.isArray(guidance.actions) && guidance.actions.length > 0 && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Suggested Actions"
                          secondary={
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                              {guidance.actions.map((a: string, i: number) => (
                                <li key={i}><Typography variant="body2">{a}</Typography></li>
                              ))}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.considerations && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Considerations"
                          secondary={guidance.considerations}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.investigationPath && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Investigation Path"
                          secondary={
                            <Box>
                              {guidance.investigationPath.immediate && guidance.investigationPath.immediate.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#dc2626' }}>
                                    Immediate Actions:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {guidance.investigationPath.immediate.map((action: string, i: number) => (
                                      <li key={i}><Typography variant="body2">{action}</Typography></li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.investigationPath.rootCause && guidance.investigationPath.rootCause.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#ea580c' }}>
                                    Root Cause Analysis:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {guidance.investigationPath.rootCause.map((action: string, i: number) => (
                                      <li key={i}><Typography variant="body2">{action}</Typography></li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.investigationPath.customerCommunication && guidance.investigationPath.customerCommunication.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#059669' }}>
                                    Customer Communication:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {guidance.investigationPath.customerCommunication.map((action: string, i: number) => (
                                      <li key={i}><Typography variant="body2">{action}</Typography></li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.investigationPath.longTermSolutions && guidance.investigationPath.longTermSolutions.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#7c3aed' }}>
                                    Long-term Solutions:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {guidance.investigationPath.longTermSolutions.map((action: string, i: number) => (
                                      <li key={i}><Typography variant="body2">{action}</Typography></li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.evidence && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Evidence"
                          secondary={
                            <Box>
                              {guidance.evidence.ticketReferences && guidance.evidence.ticketReferences.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Ticket References:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {guidance.evidence.ticketReferences.map((ticket: string, i: number) => (
                                      <Chip key={i} label={ticket} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.evidence.errorPatterns && guidance.evidence.errorPatterns.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Error Patterns:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {guidance.evidence.errorPatterns.map((pattern: string, i: number) => (
                                      <Chip key={i} label={pattern} size="small" color="error" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.evidence.affectedSystems && guidance.evidence.affectedSystems.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Affected Systems:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {guidance.evidence.affectedSystems.map((system: string, i: number) => (
                                      <Chip key={i} label={system} size="small" color="warning" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.evidence.timePatterns && guidance.evidence.timePatterns.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Time Patterns:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {guidance.evidence.timePatterns.map((pattern: string, i: number) => (
                                      <Chip key={i} label={pattern} size="small" color="info" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {guidance.evidence.links && guidance.evidence.links.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Related Links:
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {guidance.evidence.links.map((link: any, i: number) => (
                                      <li key={i}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                                          <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                              color: getLinkColor(link.type),
                                              textDecoration: 'none',
                                              fontWeight: 500,
                                              fontSize: '0.875rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                          >
                                            {link.label}
                                          </a>
                                          <Chip 
                                            label={link.type} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ 
                                              height: 16, 
                                              fontSize: '0.7rem',
                                              backgroundColor: getChipColor(link.type),
                                              color: getChipTextColor(link.type)
                                            }}
                                          />
                                        </Box>
                                        {link.description && (
                                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', ml: 2 }}>
                                            {link.description}
                                          </Typography>
                                        )}
                                      </li>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {(guidance.owner || guidance.slaDays) && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="Owner & SLA"
                          secondary={`${guidance.owner ? `Owner: ${guidance.owner}` : ''}${guidance.owner && guidance.slaDays ? ' • ' : ''}${guidance.slaDays ? `SLA: ${guidance.slaDays}d` : ''}`}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                    {guidance.links && Array.isArray(guidance.links) && guidance.links.length > 0 && (
                      <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                        <ListItemText 
                          primary="Helpful Links"
                          secondary={
                            <Box component="ul" sx={{ pl: 2, m: 0 }}>
                              {guidance.links.map((l: { label: string; url: string }, i: number) => (
                                <li key={i}>
                                  <a href={l.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{l.label}</a>
                                </li>
                              ))}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              );
            })()}
          </Paper>

          {/* Properties */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
              PROPERTIES
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Insight Domain"
                  secondary={formatTypeName(insight.type)}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Category"
                  secondary={insight.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Severity"
                  secondary={config.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.9rem' }}
                />
              </ListItem>
              {affectedUsers.length > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Affected Users"
                    secondary={affectedUsers.length}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.9rem' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Affected Users */}
          {affectedUsers.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                AFFECTED USERS ({affectedUsers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {affectedUsers.map((userId, index) => (
                  <Chip 
                    key={index}
                    label={userId}
                    size="small"
                    sx={{ 
                      backgroundColor: alpha(config.color, 0.1),
                      color: config.color,
                      fontWeight: 500
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Metadata */}
          {insight.meta && Object.keys(insight.meta).length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                DETAILED METADATA
              </Typography>
              <List dense>
                {Object.entries(insight.meta)
                  .filter(([key, value]) => {
                    // Hide SLA if it's null or empty, and hide it completely since we show it in guidance
                    if (key.toLowerCase() === 'sla') {
                      return false;
                    }
                    return true;
                  })
                  .map(([key, value]) => {
                    // Special handling for guidance object
                    if (key === 'guidance' && typeof value === 'object' && value !== null) {
                      const guidance = value as any;
                      return (
                        <ListItem key={key} sx={{ px: 0, alignItems: 'flex-start' }}>
                          <ListItemText 
                            primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            secondary={
                              <Box>
                                {guidance.summary && (
                                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: '#666' }}>
                                    {guidance.summary}
                                  </Typography>
                                )}
                                {guidance.why && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Why this matters:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      {guidance.why}
                                    </Typography>
                                  </Box>
                                )}
                                {guidance.actions && Array.isArray(guidance.actions) && guidance.actions.length > 0 && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Suggested Actions:
                                    </Typography>
                                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                      {guidance.actions.map((action: string, index: number) => (
                                        <li key={index}>
                                          <Typography variant="body2" sx={{ color: '#666' }}>
                                            {action}
                                          </Typography>
                                        </li>
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                {guidance.investigationPath && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Investigation Path:
                                    </Typography>
                                    {guidance.investigationPath.immediate && guidance.investigationPath.immediate.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: '#dc2626' }}>
                                          Immediate:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                          {guidance.investigationPath.immediate.map((action: string, i: number) => (
                                            <li key={i}><Typography variant="body2" sx={{ color: '#666' }}>{action}</Typography></li>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                    {guidance.investigationPath.rootCause && guidance.investigationPath.rootCause.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: '#ea580c' }}>
                                          Root Cause:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                          {guidance.investigationPath.rootCause.map((action: string, i: number) => (
                                            <li key={i}><Typography variant="body2" sx={{ color: '#666' }}>{action}</Typography></li>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                    {guidance.investigationPath.customerCommunication && guidance.investigationPath.customerCommunication.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: '#059669' }}>
                                          Communication:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                          {guidance.investigationPath.customerCommunication.map((action: string, i: number) => (
                                            <li key={i}><Typography variant="body2" sx={{ color: '#666' }}>{action}</Typography></li>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                    {guidance.investigationPath.longTermSolutions && guidance.investigationPath.longTermSolutions.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: '#7c3aed' }}>
                                          Long-term:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                          {guidance.investigationPath.longTermSolutions.map((action: string, i: number) => (
                                            <li key={i}><Typography variant="body2" sx={{ color: '#666' }}>{action}</Typography></li>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                                {guidance.evidence && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Evidence:
                                    </Typography>
                                    {guidance.evidence.ticketReferences && guidance.evidence.ticketReferences.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                          Tickets: {guidance.evidence.ticketReferences.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {guidance.evidence.errorPatterns && guidance.evidence.errorPatterns.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                          Errors: {guidance.evidence.errorPatterns.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {guidance.evidence.affectedSystems && guidance.evidence.affectedSystems.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                          Systems: {guidance.evidence.affectedSystems.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {guidance.evidence.timePatterns && guidance.evidence.timePatterns.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                          Time: {guidance.evidence.timePatterns.join(', ')}
                                        </Typography>
                                      </Box>
                                    )}
                                    {guidance.evidence.links && guidance.evidence.links.length > 0 && (
                                      <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                          Links:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                          {guidance.evidence.links.map((link: any, i: number) => (
                                            <li key={i}>
                                              <a 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ 
                                                  color: getLinkColor(link.type),
                                                  textDecoration: 'none',
                                                  fontSize: '0.8rem'
                                                }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                              >
                                                {link.label}
                                              </a>
                                              <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', ml: 1, display: 'inline' }}>
                                                ({link.type})
                                              </Typography>
                                            </li>
                                          ))}
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                )}
                                {(guidance.owner || guidance.slaDays) && (
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {guidance.owner && (
                                      <Chip 
                                        label={`Owner: ${guidance.owner}`}
                                        size="small"
                                        sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                                      />
                                    )}
                                    {guidance.slaDays && (
                                      <Chip 
                                        label={`SLA: ${guidance.slaDays}d`}
                                        size="small"
                                        sx={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
                                      />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            }
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ fontSize: '0.9rem' }}
                          />
                        </ListItem>
                      );
                    }
                    
                    // Default handling for other fields
                    return (
                      <ListItem key={key} sx={{ px: 0 }}>
                        <ListItemText 
                          primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          secondary={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItem>
                    );
                  })}
              </List>
            </Paper>
          )}

          {/* Comments Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                COMMENTS ({comments && Array.isArray(comments) ? comments.length : 0})
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<Email />}
                onClick={() => setShowAddComment(!showAddComment)}
                sx={{ fontSize: '0.8rem' }}
              >
                Add Comment
              </Button>
            </Box>

            {/* Add Comment Form */}
            {showAddComment && (
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e5e7eb', borderRadius: 1, backgroundColor: '#f9fafb' }}>
                <CommentDescriptionField
                  value={newComment.description}
                  onChange={(value) => setNewComment(prev => ({ ...prev, description: value }))}
                  users={users}
                  placeholder="Describe your comment. Use @username to tag users."
                  multiline={true}
                  rows={3}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    onClick={() => {
                      setShowAddComment(false);
                      setNewComment({ title: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={handleCreateComment}
                    disabled={creatingComment || !newComment.description.trim()}
                  >
                    {creatingComment ? 'Creating...' : 'Add Comment'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading comments...
                </Typography>
              </Box>
            ) : !comments || !Array.isArray(comments) || comments.length === 0 ? (
              <Box sx={{ 
                minHeight: 120, 
                border: '1px solid #e5e7eb', 
                borderRadius: 1, 
                p: 2,
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  No comments yet. Add a comment to track progress and discussions.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {comments && Array.isArray(comments) && comments.map((comment) => (
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

        {/* Action Buttons */}
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getActionButtons()}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default InsightDetailDrawer;
