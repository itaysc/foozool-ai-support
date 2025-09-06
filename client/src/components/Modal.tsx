import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  actions?: React.ReactNode;
  contentTopGap?: number; // optional spacing between title and content
  contentSx?: any; // optional sx override for DialogContent
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, maxWidth = 'sm', children, actions, contentTopGap = 0, contentSx }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)' } } as any }}
    >
      {title && (
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title}
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent dividers sx={{ pt: contentTopGap, ...(contentSx || {}) }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;


