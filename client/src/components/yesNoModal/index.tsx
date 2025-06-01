// components/YesNoModal/YesNoModal.tsx
import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { StyledDialog } from './styled';

type YesNoModalProps = {
  open: boolean;
  title?: string;
  content?: string;
  onSubmit: (value: boolean) => void;
};

const YesNoModal: React.FC<YesNoModalProps> = ({
  open,
  title = 'Are you sure?',
  content = '',
  onSubmit,
}) => {

  const handleSubmit = (value: boolean) => {
    onSubmit(value);
  }

  return (
    <StyledDialog open={open} onClose={handleSubmit.bind(this, false)} aria-labelledby="yes-no-dialog-title">
      <DialogTitle id="yes-no-dialog-title">{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit.bind(this, false)} color="secondary" variant="outlined">
          No
        </Button>
        <Button onClick={handleSubmit.bind(this, true)} color="primary" variant="contained">
          Yes
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default YesNoModal;
