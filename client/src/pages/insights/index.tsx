import React from 'react';
import { Box, Typography } from '@mui/material';

const Insights = () => {
  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Insights
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This page is currently empty.
      </Typography>
    </Box>
  );
};

export default Insights;