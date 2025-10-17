import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Folder } from '@mui/icons-material';
import documentsService from '@/services/documents-service';
import toast from '@/utils/toast';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentPath: string;
  editFolder?: {
    id: string;
    name: string;
    path: string;
  } | null;
}

const FolderDialog: React.FC<FolderDialogProps> = ({
  open,
  onClose,
  onSuccess,
  parentPath,
  editFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(editFolder);

  useEffect(() => {
    if (open) {
      setFolderName(editFolder?.name || '');
      setError(null);
    }
  }, [open, editFolder]);

  const handleSubmit = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    // Validate folder name (basic validation)
    const sanitizedName = folderName.trim().replace(/[<>:"/\\|?*]/g, '');
    if (sanitizedName !== folderName.trim()) {
      setError('Folder name contains invalid characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode && editFolder) {
        // Edit existing folder
        await documentsService.renameFolder(editFolder.id, sanitizedName);
        toast.success('Folder renamed successfully');
      } else {
        // Create new folder
        await documentsService.createFolder(sanitizedName, parentPath);
        toast.success('Folder created successfully');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error saving folder:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save folder';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError(null);
    onClose();
  };

  const getDialogTitle = () => {
    if (isEditMode) {
      return 'Rename Folder';
    }
    return 'Create New Folder';
  };

  const getSubmitButtonText = () => {
    if (loading) {
      return isEditMode ? 'Renaming...' : 'Creating...';
    }
    return isEditMode ? 'Rename' : 'Create';
  };

  const getParentPathDisplay = () => {
    if (parentPath === '/') {
      return 'Root folder';
    }
    return parentPath;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Folder color="primary" />
          <Typography variant="h6" component="span">
            {getDialogTitle()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isEditMode 
              ? `Rename folder "${editFolder?.name}"`
              : `Create a new folder in ${getParentPathDisplay()}`
            }
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Enter folder name"
            disabled={loading}
            error={Boolean(error)}
            helperText={
              error 
                ? error
                : 'Folder name cannot contain: < > : " / \\ | ? *'
            }
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSubmit();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />

          {!isEditMode && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Location:</strong> {getParentPathDisplay()}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !folderName.trim()}
          sx={{ borderRadius: 1 }}
        >
          {getSubmitButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderDialog;
