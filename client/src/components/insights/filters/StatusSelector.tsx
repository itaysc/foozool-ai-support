import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  ClickAwayListener,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Typography,
  alpha,
  Chip
} from '@mui/material';
import { 
  FiberManualRecord, 
  PlayArrow, 
  CheckCircle, 
  Cancel, 
  Refresh 
} from '@mui/icons-material';

interface StatusSelectorProps {
  status?: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
  hasPermission?: boolean;
  updating?: boolean;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  status = 'new',
  onStatusChange,
  disabled = false,
  hasPermission = true,
  updating = false
}) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const statusConfig = {
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

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled || !hasPermission || updating) return;
    
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  const handleStatusSelect = (newStatus: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    onStatusChange(newStatus);
    handleClose();
  };

  const getStatusIcon = (statusKey: string) => {
    const config = statusConfig[statusKey as keyof typeof statusConfig];
    if (!config) return <FiberManualRecord sx={{ fontSize: 14 }} />;
    const IconComponent = config.icon;
    return <IconComponent sx={{ fontSize: 14 }} />;
  };

  return (
    <>
      <Box
        ref={statusRef}
        className="status-selector"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: disabled || !hasPermission ? 'default' : 'pointer',
          '&:hover': disabled || !hasPermission ? {} : {
            '& .status-chip': {
              transform: 'scale(1.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }
          }
        }}
        onClick={handleStatusClick}
      >
        <Chip
          className="status-chip"
          label={currentStatus.label}
          size="small"
          icon={getStatusIcon(status || 'new')}
          sx={{
            backgroundColor: updating ? alpha(currentStatus.color, 0.2) : currentStatus.bgColor,
            color: currentStatus.color,
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 20,
            minWidth: 80,
            width: 80,
            justifyContent: 'center',
            transition: 'all 0.2s ease-in-out',
            opacity: updating ? 0.7 : 1,
            cursor: disabled || !hasPermission || updating ? 'default' : 'pointer',
            '& .MuiChip-label': {
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'unset'
            },
            '& .MuiChip-icon': {
              color: currentStatus.color,
              fontSize: 14
            }
          }}
        />
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
              minWidth: 150,
              maxWidth: 200,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              borderRadius: 2
            }}
          >
            <Box 
              sx={{ maxHeight: 300, overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <List dense>
                {Object.entries(statusConfig).map(([statusKey, config]) => (
                  <ListItem key={statusKey} disablePadding>
                    <ListItemButton
                      onClick={(event) => handleStatusSelect(statusKey, event)}
                      selected={status === statusKey}
                      sx={{
                        py: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: alpha(config.color, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(config.color, 0.15)
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ color: config.color }}>
                          {getStatusIcon(statusKey)}
                        </Box>
                        <ListItemText
                          primary={config.label}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: status === statusKey ? 600 : 500,
                            color: config.color
                          }}
                        />
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default StatusSelector;
