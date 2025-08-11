import { observer } from 'mobx-react';
import * as styled from './styled';
import { AvatarMenu } from '../avatarMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Box, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SmartToy from '@mui/icons-material/SmartToy';
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
    { path: '/bot-performance', label: 'Performance & Insights', icon: SmartToy },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <styled.Container drawerOpen={false}>
      <styled.LeftSide>
        <span style={{color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>TKTAI</span>
        {/* <img src="/logo/logo-transparent.svg" alt="foozool logo" width={180} height={45} /> */}
      </styled.LeftSide>
      <styled.RightSide>
        
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
