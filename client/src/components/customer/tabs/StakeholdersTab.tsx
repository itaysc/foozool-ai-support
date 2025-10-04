import React from 'react';
import { Box } from '@mui/material';
import StakeholderManagement from '@/components/stakeholder/StakeholderManagement';

interface StakeholdersTabProps {
  customerId: string;
}

const StakeholdersTab: React.FC<StakeholdersTabProps> = ({
  customerId,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <StakeholderManagement customerId={customerId} />
    </Box>
  );
};

export default StakeholdersTab;
