import { observer } from 'mobx-react';
import * as styled from './styled';
import { AvatarMenu } from '../avatarMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Box, Chip, useTheme, useMediaQuery } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessIcon from '@mui/icons-material/Business';
import { useState } from 'react';
import { useAuth } from '@/context/auth.context';
import config from '@/config';

export const Navbar = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navigationItems = [
    { path: '/insights', label: 'AI Insights', icon: InsightsIcon },
    { path: '/performance', label: 'Performance', icon: AnalyticsIcon },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Get organization name from user data
  const getOrganizationName = () => {
    if (!user?.organization) return '';
    
    // Check if organization is populated (has name property) or just an ID
    if (typeof user.organization === 'object' && 'name' in user.organization) {
      return user.organization.name;
    }
    
    return '';
  };

  const organizationName = getOrganizationName();
  const environment = config.environment || 'development';

  return (
    <styled.Container drawerOpen={false}>
      <styled.LeftSide>
        <Box display="flex" alignItems="center" gap={isSmallScreen ? 1 : 2}>
          <span style={{color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>TKTAI</span>
          
          {/* Organization and Environment Info */}
          {organizationName && !isSmallScreen && (
            <Box display="flex" alignItems="center" gap={1}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.875rem'
                }}
              >
                <BusinessIcon sx={{ fontSize: '1rem' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {organizationName}
                </Typography>
              </Box>
              
              <Chip
                label={environment}
                size="small"
                sx={{
                  backgroundColor: environment === 'production' 
                    ? 'rgba(255, 255, 255, 0.9)' 
                    : environment === 'staging' 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.9)',
                  color: environment === 'production' 
                    ? '#2e7d32' 
                    : environment === 'staging' 
                    ? '#f57c00'
                    : '#7b1fa2',
                  border: `1px solid ${
                    environment === 'production' 
                      ? 'rgba(46, 125, 50, 0.3)' 
                      : environment === 'staging' 
                      ? 'rgba(245, 124, 0, 0.3)'
                      : 'rgba(123, 31, 162, 0.3)'
                  }`,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  height: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  '& .MuiChip-label': {
                    px: 1,
                  }
                }}
              />
            </Box>
          )}
        </Box>
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
              {!isSmallScreen && (
                <Typography variant="body2" fontWeight={isActive(path) ? '600' : '500'}>
                  {label}
                </Typography>
              )}
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
