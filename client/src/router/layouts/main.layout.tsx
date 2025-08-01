import { Outlet } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { Navbar } from '@/components';
import { useMainLayoutContext } from '@/context/mainLayout.context';
import { useEffect } from 'react';
import { ChatProvider } from '@/context/chat/chat.context';
import { Box } from '@mui/material';

export default function Layout() {
  const { isLoading } = useMainLayoutContext();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      {isLoading && (
        <Box sx={{ position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 999 }}>
          <LinearProgress />
        </Box>
      )}
      <Box 
        component="main" 
        sx={{ 
          flex: 1,
          pt: '80px', // Account for fixed navbar
          px: { xs: 2, md: 4 },
          pb: 4
        }}
      >
        <ChatProvider>
          <Outlet />
        </ChatProvider>
      </Box>
    </Box>
  );
}