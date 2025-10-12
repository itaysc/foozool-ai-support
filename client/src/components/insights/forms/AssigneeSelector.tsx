import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Avatar,
  Box,
  ClickAwayListener,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Typography,
  alpha,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import { Person, Add, Close, Search } from '@mui/icons-material';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

interface AssigneeSelectorProps {
  assignee?: string | null;
  users: User[];
  onAssigneeChange?: (userId: string | null) => void;
  insight?: any; // Support insight-based approach
  onInsightUpdate?: (insightId: string, updates: any) => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  updating?: boolean;
}

const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  assignee,
  users,
  onAssigneeChange,
  insight,
  onInsightUpdate,
  size = 'small',
  disabled = false,
  updating = false
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const avatarRef = useRef<HTMLDivElement>(null);

  // Determine current assignee from either direct prop or insight
  const currentAssignee = assignee || insight?.assignee || insight?.meta?.assignee;
  const currentUser = users.find(user => user._id === currentAssignee);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [users, searchQuery]);

  const getAvatarSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'medium': return 32;
      case 'large': return 40;
      default: return 24;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return '0.7rem';
      case 'medium': return '0.8rem';
      case 'large': return '1rem';
      default: return '0.7rem';
    }
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || updating) return;
    
    event.stopPropagation(); // Prevent event from bubbling up to row
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
    setSearchQuery(''); // Reset search when closing
  };

  const handleUserSelect = (userId: string | null, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Handle insight-based approach
    if (insight && onInsightUpdate) {
      const insightId = insight.id || insight.meta?.insightId || insight._id;
      onInsightUpdate(insightId, { assignee: userId });
    } 
    // Handle direct assignee approach
    else if (onAssigneeChange) {
      onAssigneeChange(userId);
    }
    
    handleClose();
  };

  const handleUnassign = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Handle insight-based approach
    if (insight && onInsightUpdate) {
      const insightId = insight.id || insight.meta?.insightId || insight._id;
      onInsightUpdate(insightId, { assignee: null });
    } 
    // Handle direct assignee approach
    else if (onAssigneeChange) {
      onAssigneeChange(null);
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name;
  };

  const getAvatarColor = (user: User) => {
    const name = getUserDisplayName(user);
    // Generate a consistent color based on the name
    const colors = [
      '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac',
      '#4299e1', '#9f7aea', '#ed64a6', '#f687b3', '#4fd1c7'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <>
      <Box
        ref={avatarRef}
        className="assignee-selector"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: disabled || updating ? 'default' : 'pointer',
          opacity: updating ? 0.7 : 1,
          '&:hover': disabled || updating ? {} : {
            '& .assignee-avatar': {
              transform: 'scale(1.1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }
        }}
        onClick={handleAvatarClick}
      >
        {currentUser ? (
          <Tooltip title={`${getUserDisplayName(currentUser)} (${currentUser.email})`} arrow>
            <Avatar
              className="assignee-avatar"
              sx={{
                width: getAvatarSize(),
                height: getAvatarSize(),
                fontSize: getFontSize(),
                backgroundColor: getAvatarColor(currentUser),
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
              src={currentUser.avatar}
            >
              {!currentUser.avatar && getInitials(currentUser)}
            </Avatar>
          </Tooltip>
        ) : (
          <Tooltip title="Assign to user" arrow>
            <Avatar
              className="assignee-avatar"
              sx={{
                width: getAvatarSize(),
                height: getAvatarSize(),
                fontSize: getFontSize(),
                backgroundColor: alpha('#6b7280', 0.2),
                color: '#6b7280',
                border: '2px dashed #d1d5db',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Person sx={{ fontSize: getFontSize() }} />
            </Avatar>
          </Tooltip>
        )}
        
        {/* Unassign button for assigned users */}
        {currentUser && !disabled && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              backgroundColor: '#ef4444',
              color: 'white',
              '&:hover': {
                backgroundColor: '#dc2626'
              },
              '& .MuiSvgIcon-root': {
                fontSize: 8
              }
            }}
            onClick={handleUnassign}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            sx={{
              minWidth: 250,
              maxWidth: 350,
              maxHeight: 400,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              borderRadius: 2
            }}
          >
            {/* Search Field */}
            <Box 
              sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb' }}
              onClick={(e) => e.stopPropagation()}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                    },
                  },
                }}
              />
            </Box>
            
            <Box 
              sx={{ maxHeight: 300, overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <List dense>
              {/* Unassign option */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={(event) => handleUserSelect(null, event)}
                  sx={{
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: alpha('#ef4444', 0.1)
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: alpha('#ef4444', 0.1),
                        color: '#ef4444'
                      }}
                    >
                      <Close sx={{ fontSize: 14 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Unassign"
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      fontWeight: 500
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* User list */}
              {filteredUsers.map((user) => {
                const isSelected = assignee === user._id;
                return (
                  <ListItem key={user._id} disablePadding>
                    <ListItemButton
                      onClick={(event) => handleUserSelect(user._id, event)}
                      selected={isSelected}
                      sx={{
                        py: 0.5,
                        backgroundColor: isSelected ? alpha('#3b82f6', 0.1) : 'transparent',
                        '&.Mui-selected': {
                          backgroundColor: alpha('#3b82f6', 0.1),
                          '&:hover': {
                            backgroundColor: alpha('#3b82f6', 0.15)
                          }
                        },
                        '&:hover': {
                          backgroundColor: isSelected ? alpha('#3b82f6', 0.15) : alpha('#3b82f6', 0.1)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.7rem',
                            backgroundColor: getAvatarColor(user)
                          }}
                          src={user.avatar}
                        >
                          {!user.avatar && getInitials(user)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={getUserDisplayName(user)}
                        secondary={user.email}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#3b82f6' : 'inherit'
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.65rem',
                          color: 'text.secondary',
                          lineHeight: 1.2
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}

              {filteredUsers.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={searchQuery ? "No users found" : "No users available"}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      color: 'text.secondary',
                      textAlign: 'center'
                    }}
                  />
                </ListItem>
              )}
              </List>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default AssigneeSelector;
