import { observer } from 'mobx-react';
import * as styled from './styled';
import { AvatarMenu } from '../avatarMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Box, 
  Chip, 
  useTheme, 
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessIcon from '@mui/icons-material/Business';
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import { useAuth } from '@/context/auth.context';
import config from '@/config';
import customTheme from '@/styles/theme';

export const Navbar = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, signOut } = useAuth();
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const goToAbout = () => {
    setMobileMenuOpen(false);
    navigate('/about');
  };

  const goToHelpCenter = () => {
    setMobileMenuOpen(false);
    // Navigate to help center or open help modal
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      setIsSigningOut(false);
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('❌ Error during sign out:', err);
      setIsSigningOut(false);
    }
  };

  const navigationItems = [
    { path: '/insights', label: 'AI Insights', icon: InsightsIcon },
    { path: '/performance', label: 'Performance', icon: AnalyticsIcon },
    { path: '/anomalies', label: 'Anomalies', icon: WarningIcon },
    { path: '/customers', label: 'Customers', icon: PeopleIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
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

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return 'User';
  };

  return (
    <>
      <styled.Container drawerOpen={mobileMenuOpen}>
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
        </styled.LeftSide>
        
        <styled.RightSide>
          {/* Mobile Hamburger Menu */}
          {isSmallScreen && (
            <IconButton
              onClick={handleMobileMenuToggle}
              sx={{
                color: 'white',
                marginRight: 1,
                padding: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '2rem',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
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

          {/* Desktop Navigation buttons */}
          {!isSmallScreen && navigationItems.map(({ path, label, icon: Icon }) => (
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

          {/* Desktop Avatar Menu - Hidden on mobile */}
          {!isSmallScreen && (
            <Box sx={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
              <AvatarMenu />
            </Box>
          )}
        </styled.RightSide>
      </styled.Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: '280px',
            backgroundColor: customTheme.colors.primary.main,
            color: 'white',
            '& .MuiDrawer-paper': {
              backgroundColor: customTheme.colors.primary.main,
              border: 'none',
            }
          }
        }}
      >
        {/* Header with User Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Menu
            </Typography>
            <IconButton
              onClick={() => setMobileMenuOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* User Profile Section - Moved to top and made smaller */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                width: 32,
                height: 32
              }}
            >
              {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Menu */}
        <List sx={{ pt: 1 }}>
          {/* Navigation Items */}
          {navigationItems.map(({ path, label, icon: Icon }) => (
            <ListItem key={path} disablePadding>
              <ListItemButton
                onClick={() => handleMobileNavigation(path)}
                sx={{
                  py: 2,
                  px: 3,
                  backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: isActive(path) ? '600' : '500',
                    fontSize: '1rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

        {/* Additional Menu Items */}
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={goToHelpCenter}
              sx={{
                py: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Help Center"
                primaryTypographyProps={{
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={goToAbout}
              sx={{
                py: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText 
                primary="About"
                primaryTypographyProps={{
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

        {/* Sign Out Option */}
        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleSignOut}
              disabled={isSigningOut}
              sx={{
                py: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                '&:disabled': {
                  opacity: 0.6,
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {isSigningOut ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <LogoutIcon />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Sign Out"
                primaryTypographyProps={{
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Organization Info in Mobile Menu */}
        {organizationName && (
          <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 'auto' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BusinessIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.8)' }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Organization
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
              {organizationName}
            </Typography>
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
      </Drawer>
    </>
  );
});

export default Navbar;
