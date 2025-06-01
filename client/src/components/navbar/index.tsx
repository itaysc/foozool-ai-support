import { observer } from 'mobx-react';
import * as styled from './styled';
import { AvatarMenu } from '../avatarMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import configStore from '@/stores/config.store';

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

  const selectModel = (model: string) => {
    configStore.setSelectedModel(model);
    handleClose()
  }

  return (
    <styled.Container drawerOpen={false}>
      <styled.LeftSide>
        <img src="/logo/logo-transparent.svg" alt="foozool logo" width={200} height={100} />
      </styled.LeftSide>
      <styled.RightSide>
        
        {/* Model Dropdown */}
        <styled.TabButton onClick={handleClick} active={false}>
          Model
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
            },
          }}
        >
          {configStore.config?.supportedModels.map(({ displayName, isRecommended, model }) => (
            <MenuItem key={displayName} onClick={() => selectModel(model)} selected={model === configStore.selectedModel}>
              <ListItemIcon sx={{ minWidth: 30 }}>
                {model === configStore.selectedModel && <CheckIcon sx={{ color: 'green' }} />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Typography>{displayName}</Typography>
                    {isRecommended && (
                      <Typography variant="caption" color="primary">
                        recommended
                      </Typography>
                    )}
                  </Box>
                }
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Navigation buttons */}
        <styled.TabButton 
          onClick={() => navigate('/dashboard')}
          active={location.pathname === '/dashboard'}
        >
          Dashboard
        </styled.TabButton>
        <styled.TabButton 
          onClick={() => navigate('/integrations')}
          active={location.pathname === '/integrations'}
        >
          Integrations
        </styled.TabButton>
        <styled.TabButton 
          onClick={() => navigate('/rules')}
          active={location.pathname === '/rules' || location.pathname.includes('/bot/')}
        >
          Rules & Logic
        </styled.TabButton>
        <styled.TabButton 
          onClick={() => navigate('/settings')}
          active={location.pathname === '/settings'}
        >
          Settings
        </styled.TabButton>
        <styled.TabButton 
          onClick={() => navigate('/analytics')}
          active={location.pathname === '/analytics'}
        >
          Analytics
        </styled.TabButton>

        <div style={{ marginLeft: '20px' }}>
          <AvatarMenu />
        </div>
      </styled.RightSide>
    </styled.Container>
  );
});

export default Navbar;
