// components/FullScreenLoaderOverlay/FullScreenLoaderOverlay.tsx
import React from 'react';
import { Button } from '@mui/material';
import { FixedFooterWrapper } from './styled';

interface FixedFooterAction {
  type: 'button' | 'link' | 'buttonDropDown';
  label: string;
  onClick: (e: React.FormEvent) => void;
  disabled?: boolean;
}

interface FixedFooterProps {
  actions: FixedFooterAction[];
};

const FixedFooter: React.FC<FixedFooterProps> = ({ actions }) => {

  const onCLick = (e: React.FormEvent, action: FixedFooterAction) => {
    e.preventDefault();
    e.stopPropagation();
    action.onClick(e);
  }
  const renderAction = (action: FixedFooterAction) => {
    switch (action.type) {
      case 'button':
        return <Button 
            variant="contained" 
            color="primary"
            type="submit"
            key={action.label}
            onClick={(e) => onCLick(e, action)} 
            disabled={action.disabled}
            sx={{
                marginLeft: '10px',
                borderRadius: '30px',
            }}
            >{action.label}</Button>
    }
  }
  return (
    <FixedFooterWrapper>
        {actions.map((action) => (
            renderAction(action)
        ))}
    </FixedFooterWrapper>
  );
};

export default FixedFooter;
