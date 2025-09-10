import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
}

interface SideBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navItems: NavItem[];
  width?: number;
}

const SideBar: React.FC<SideBarProps> = ({
  activeTab,
  onTabChange,
  navItems,
  width = 280
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        width: width,
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        zIndex: 1000,
        borderRadius: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflowY: 'auto'
      }}
    >
      <List sx={{ px: 1, py: 1 }}>
        {navItems
          .filter(item => item.visible)
          .map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={activeTab === item.id}
                onClick={() => onTabChange(item.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: activeTab === item.id ? 'primary.contrastText' : 'text.secondary'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: activeTab === item.id ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Paper>
  );
};

export default SideBar;
