import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { Link } from '@mui/icons-material';
import documentsService from '@/services/documents-service';
import customersStore from '@/stores/customers.store';
import toast from '@/utils/toast';

interface LinkDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPath: string;
  currentFolderId?: string | null;
}

const LinkDocumentDialog: React.FC<LinkDocumentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  currentPath,
  currentFolderId
}) => {
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!linkUrl.trim()) {
      setError('Link URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await documentsService.createDocument({
        title: title.trim(),
        documentType: 'link',
        linkUrl: linkUrl.trim(),
        linkDescription: linkDescription.trim() || undefined,
        customerId: customerId || undefined,
        folderPath: currentPath,
        parentFolderId: currentFolderId || undefined,
        tags: tags,
        content: linkDescription.trim() || undefined // Use description as content
      });

      toast.success('Link document created successfully');
      onSuccess();
      onClose();
      
      // Reset form
      setTitle('');
      setLinkUrl('');
      setLinkDescription('');
      setCustomerId('');
      setTags([]);
    } catch (err: any) {
      console.error('Error creating link document:', err);
      setError(err.response?.data?.message || 'Failed to create link document');
      toast.error(err.response?.data?.message || 'Failed to create link document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setTitle('');
      setLinkUrl('');
      setLinkDescription('');
      setCustomerId('');
      setTags([]);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link color="primary" />
        <Typography variant="h6">Create Link Document</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label="Document Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
          
          <TextField
            label="Link URL"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            disabled={loading}
            required
            placeholder="https://example.com/document.pdf"
            helperText="Enter the URL to the external file or document"
          />
          
          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={linkDescription}
            onChange={(e) => setLinkDescription(e.target.value)}
            disabled={loading}
            placeholder="Brief description of the linked content..."
          />
          
          <TextField
            select
            label="Customer (Optional)"
            fullWidth
            variant="outlined"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={loading}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">No customer</option>
            {customersStore.customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </TextField>
          
          <TextField
            label="Tags (Optional)"
            fullWidth
            variant="outlined"
            value={tags.join(', ')}
            onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
            disabled={loading}
            placeholder="tag1, tag2, tag3"
            helperText="Separate tags with commas"
          />
          
          <Typography variant="body2" color="text.secondary">
            <strong>Location:</strong> {currentPath === '/' ? 'Root folder' : currentPath}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim() || !linkUrl.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Link Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkDocumentDialog;
