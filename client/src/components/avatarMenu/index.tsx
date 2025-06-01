/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Menu, MenuItem, Avatar, IconButton, Divider, CircularProgress } from '@mui/material';
import { IoLogOutOutline, IoInformationCircleOutline, IoHelpBuoyOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import authStore from '@/stores/auth.store';
import theme from '@/styles/theme';

export const AvatarMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = authStore.user;
  const navigate = useNavigate();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const goToAbout = () => {
    handleClose();
    navigate('/about');
  }

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      await authStore.signOut();
      setIsSigningOut(false);
      navigate('/login');
    } catch (err) {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <IconButton onClick={handleOpen} aria-label="account menu" sx={{
          borderRadius: '50%',
          outline: 'none',
          width: '42px',
          height: '42px',
          border: 'none',
          backgroundColor: theme.colors.secondary.main,
          '&:hover': {
            backgroundColor: theme.colors.secondary.main,
          },
          '&:focus': {
            outline: 'none',
            border: 'none',
          }
        }}>
          {
            user?.avatarImage ? <Avatar alt={user?.fullName || ''} src={user?.avatarImage || ''} sx={{ width: '42px', height: '42px' }} />
            : <span style={{ color: theme.colors.primary.contrastText, fontSize: '1rem' }}>{user?.firstName?.charAt(0) + user?.lastName?.charAt(0)}</span>
          }
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        keepMounted
      >
        <MenuItem disabled>
          <Avatar sx={{ width: 32, height: 32, marginRight: 1 }} src={user?.avatarImage || ''} />
          {user?.fullName || ''}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClose}>
          <IoHelpBuoyOutline size='1.3rem' style={{ marginRight: 8 }} /> Help Center
        </MenuItem>
        <MenuItem onClick={goToAbout}>
          <IoInformationCircleOutline size='1.3rem' style={{ marginRight: 8 }} /> About
        </MenuItem>
        <Divider />
        <MenuItem onClick={signOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <CircularProgress size={16} sx={{ marginRight: 1 }} />
          ) : (
            <IoLogOutOutline size='1.3rem' style={{ marginRight: 8 }} />
          )}
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
};

export default AvatarMenu;