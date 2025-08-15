// components/YesNoModal/YesNoModal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface YesNoModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
  loading?: boolean;
}

const YesNoModal: React.FC<YesNoModalProps> = ({
  open,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  onClose,
  severity = 'info',
  loading = false
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'primary';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <span style={{ fontSize: '1.5rem' }}>{getSeverityIcon()}</span>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 80 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={getSeverityColor()}
          disabled={loading}
          sx={{ minWidth: 80 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default YesNoModal;
