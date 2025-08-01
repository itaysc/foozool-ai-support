import { observer } from 'mobx-react';
import * as styled from './styled';
import { AvatarMenu } from '../avatarMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Box, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DashboardIcon from '@mui/icons-material/Dashboard';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import RuleIcon from '@mui/icons-material/Rule';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useState } from 'react';

export const Navbar = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/integrations', label: 'Integrations', icon: IntegrationInstructionsIcon },
    { path: '/rules', label: 'Rules & Logic', icon: RuleIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
    { path: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/rules') {
      return location.pathname === '/rules' || location.pathname.includes('/bot/');
    }
    return location.pathname === path;
  };

  return (
    <styled.Container drawerOpen={false}>
      <styled.LeftSide>
        <span style={{color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>TKTAI</span>
        {/* <img src="/logo/logo-transparent.svg" alt="foozool logo" width={180} height={45} /> */}
      </styled.LeftSide>
      <styled.RightSide>
        
        {/* Model Dropdown */}
        <styled.TabButton onClick={handleClick} active={false}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight={500}>
              Model
            </Typography>
            <Chip 
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                color: 'white',
                fontSize: '0.7rem',
                height: '20px'
              }} 
            />
          </Box>
        </styled.TabButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleClose()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              width: '470px',
              mt: 1,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
        </Menu>

        {/* Navigation buttons */}
        {navigationItems.map(({ path, label, icon: Icon }) => (
          <styled.TabButton 
            key={path}
            onClick={() => navigate(path)}
            active={isActive(path)}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Icon sx={{ fontSize: '1.1rem' }} />
              <Typography variant="body2" fontWeight={isActive(path) ? '600' : '500'}>
                {label}
              </Typography>
            </Box>
          </styled.TabButton>
        ))}

        <Box sx={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
          <AvatarMenu />
        </Box>
      </styled.RightSide>
    </styled.Container>
  );
});

export default Navbar;
