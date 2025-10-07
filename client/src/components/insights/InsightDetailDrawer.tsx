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
  ClickAwayListener,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Close, 
  TrendingUp, 
  People, 
  School, 
  Email,
  Schedule,
  Download,
  Person,
  Search,
  Check
} from '@mui/icons-material';
import { CustomerSuccessInsight } from '@/types/customerSuccess';
import { insightsService } from '@/services/insights-service';

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
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await insightsService.getUsers();
        if (response.success) {
          const formattedUsers = response.data.map(user => ({
            _id: user._id,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            email: user.email
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
      setAssigneeDropdownOpen(false);
      setStatusDropdownOpen(false);
      setSearchTerm('');
    }
  }, [open]);

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

  const getAssigneeUser = () => {
    if (!insight.assignee) return null;
    return users.find(user => user._id === insight.assignee);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    // Generate a consistent color based on the name
    const colors = [
      '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac',
      '#4299e1', '#9f7aea', '#ed64a6', '#f687b3', '#4fd1c7'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleAssigneeChange = async (assigneeId: string | null) => {
    if (!insight.id || !onInsightUpdate) return;
    
    setUpdating(true);
    try {
      await insightsService.updateInsightAssignee(insight.id, assigneeId);
      onInsightUpdate(insight.id, { assignee: assigneeId || undefined });
      setAssigneeDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update assignee:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!insight.id || !onInsightUpdate) return;
    
    setUpdating(true);
    try {
      await insightsService.updateInsightStatus(insight.id, status);
      onInsightUpdate(insight.id, { status: status as any });
      setStatusDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { color: '#6b7280', label: 'New' };
      case 'in_progress':
        return { color: '#3b82f6', label: 'In Progress' };
      case 'resolved':
        return { color: '#10b981', label: 'Resolved' };
      case 'closed':
        return { color: '#6b7280', label: 'Closed' };
      case 'reopened':
        return { color: '#f59e0b', label: 'Reopened' };
      default:
        return { color: '#6b7280', label: 'Unknown' };
    }
  };

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'reopened', label: 'Reopened' }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const affectedUsers = getAffectedUsers();
  const config = getSeverityConfig(insight.severity);
  const assigneeUser = getAssigneeUser();
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
              {/* Assignee Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                <Box 
                  data-assignee-selector
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    cursor: 'pointer',
                    opacity: updating ? 0.6 : 1,
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => !updating && setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                >
                  <Avatar sx={{ width: 32, height: 32, backgroundColor: assigneeUser ? getAvatarColor(assigneeUser.name) : alpha('#6b7280', 0.2), color: assigneeUser ? 'white' : '#6b7280' }}>
                    {assigneeUser ? getInitials(assigneeUser.name) : <Person sx={{ fontSize: 18 }} />}
                  </Avatar>
                </Box>
                
                {/* Assignee Dropdown */}
                <Popper
                  open={assigneeDropdownOpen}
                  anchorEl={document.querySelector('[data-assignee-selector]')}
                  placement="bottom-start"
                  style={{ zIndex: 1300 }}
                >
                  <ClickAwayListener onClickAway={() => setAssigneeDropdownOpen(false)}>
                    <Paper sx={{ 
                      mt: 1, 
                      minWidth: 250, 
                      maxHeight: 300, 
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      borderRadius: 2
                    }}>
                      <Box sx={{ p: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Search sx={{ fontSize: 16 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.5,
                            cursor: 'pointer',
                            borderRadius: 1,
                            '&:hover': { backgroundColor: alpha('#3b82f6', 0.1) },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                          onClick={() => handleAssigneeChange(null)}
                        >
                          <Avatar sx={{ width: 24, height: 24, backgroundColor: alpha('#ef4444', 0.1), color: '#ef4444' }}>
                            <Person sx={{ fontSize: 14 }} />
                          </Avatar>
                          <Typography variant="body2">Unassigned</Typography>
                          {!insight.assignee && <Check sx={{ fontSize: 16, ml: 'auto' }} />}
                        </Box>
                        {filteredUsers.map((user) => (
                          <Box
                            key={user._id}
                            sx={{
                              px: 1,
                              py: 0.5,
                              cursor: 'pointer',
                              borderRadius: 1,
                              '&:hover': { backgroundColor: alpha('#3b82f6', 0.1) },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                            onClick={() => handleAssigneeChange(user._id)}
                          >
                            <Avatar sx={{ width: 24, height: 24, backgroundColor: getAvatarColor(user.name), color: 'white' }}>
                              {getInitials(user.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{user.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                            {insight.assignee === user._id && <Check sx={{ fontSize: 16, ml: 'auto' }} />}
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>
              
              {/* Severity Badge */}
              <Chip 
                label={config.label}
                size="small"
                sx={{
                  backgroundColor: config.color,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
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
                    sx={{
                      backgroundColor: statusConfig.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      minWidth: 80,
                      width: 80,
                      justifyContent: 'center'
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
                          return (
                            <Box
                              key={option.value}
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: alpha('#3b82f6', 0.1) },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                              onClick={() => handleStatusChange(option.value)}
                            >
                              <Chip 
                                label={optionConfig.label}
                                size="small"
                                sx={{
                                  backgroundColor: optionConfig.color,
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 20,
                                  minWidth: 70,
                                  width: 70,
                                  justifyContent: 'center'
                                }}
                              />
                              {insight.status === option.value && <Check sx={{ fontSize: 16, ml: 'auto' }} />}
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
                {Object.entries(insight.meta).map(([key, value]) => (
                  <ListItem key={key} sx={{ px: 0 }}>
                    <ListItemText 
                      primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      secondary={String(value)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Comments Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
              COMMENTS
            </Typography>
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
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<Email />}
                sx={{ fontSize: '0.8rem' }}
              >
                Add Comment
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                sx={{ fontSize: '0.8rem' }}
              >
                View All
              </Button>
            </Box>
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
