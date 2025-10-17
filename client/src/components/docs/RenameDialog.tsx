import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import documentsService from '@/services/documents-service';
import toast from '@/utils/toast';

interface RenameDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
  } | null;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onClose,
  onSuccess,
  item
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && open) {
      setNewName(item.name);
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!item || !newName.trim()) {
      return;
    }

    try {
      setLoading(true);

      if (item.isFolder) {
        await documentsService.renameFolder(item.id, newName.trim());
      } else {
        await documentsService.updateDocument(item.id, {
          title: newName.trim()
        });
      }

      toast.success(`${item.isFolder ? 'Folder' : 'Document'} renamed successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error renaming item:', error);
      toast.error(error.response?.data?.error || `Failed to rename ${item.isFolder ? 'folder' : 'document'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Rename {item?.isFolder ? 'Folder' : 'Document'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a new name for the {item?.isFolder ? 'folder' : 'document'}:
          </Typography>
          <TextField
            fullWidth
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`Enter ${item?.isFolder ? 'folder' : 'document'} name`}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!newName.trim() || loading}
        >
          {loading ? 'Renaming...' : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
