import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CloudQueue,
  Search,
  Description
} from '@mui/icons-material';
import documentsService from '@/services/documents-service';
import customersStore from '@/stores/customers.store';
import toast from '@/utils/toast';
import axios from '@/services/axios';
import config from '@/config';

const getRoute = (endpoint: string) => `${config.apiUrl}/${endpoint}`;

interface GoogleDoc {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
  mimeType: string;
}

interface GoogleDocSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPath: string;
  currentFolderId?: string | null;
}

const GoogleDocSelectionDialog: React.FC<GoogleDocSelectionDialogProps> = ({
  open,
  onClose,
  onSuccess,
  currentPath,
  currentFolderId
}) => {
  const [googleDocs, setGoogleDocs] = useState<GoogleDoc[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<GoogleDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<GoogleDoc | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadGoogleDocs();
    }
  }, [open]);

  useEffect(() => {
    // Filter docs based on search term
    if (searchTerm.trim()) {
      const filtered = googleDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocs(filtered);
    } else {
      setFilteredDocs(googleDocs);
    }
  }, [searchTerm, googleDocs]);

  const loadGoogleDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      
              // Call the Google Drive documents endpoint
              const response = await axios.get(getRoute('google/drive/documents'));
      const docs = response.data;
      setGoogleDocs(docs);
    } catch (err: any) {
      console.error('Error loading Google Docs:', err);
      setError('Failed to load Google Docs. Please check your Google Drive connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (doc: GoogleDoc) => {
    setSelectedDoc(doc);
  };

  const handleCreateDocument = async () => {
    if (!selectedDoc) {
      setError('Please select a Google Doc');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await documentsService.createDocument({
        title: selectedDoc.name,
        documentType: 'google_doc',
        googleDocId: selectedDoc.id,
        googleDocUrl: selectedDoc.webViewLink,
        customerId: customerId || undefined,
        folderPath: currentPath,
        parentFolderId: currentFolderId || undefined,
        tags: tags,
        content: `Google Doc: ${selectedDoc.name}\nURL: ${selectedDoc.webViewLink}`
      });

      toast.success('Google Doc document created successfully');
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedDoc(null);
      setCustomerId('');
      setTags([]);
      setSearchTerm('');
    } catch (err: any) {
      console.error('Error creating Google Doc document:', err);
      setError(err.response?.data?.message || 'Failed to create Google Doc document');
      toast.error(err.response?.data?.message || 'Failed to create Google Doc document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setSelectedDoc(null);
      setCustomerId('');
      setTags([]);
      setSearchTerm('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudQueue color="primary" />
        <Box>
          <Typography variant="h6">Select Google Doc</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a document from your Google Drive
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            placeholder="Search Google Docs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />
          
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredDocs.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No Google Docs found"
                    secondary={searchTerm ? "Try adjusting your search terms" : "Make sure you have Google Drive connected"}
                  />
                </ListItem>
              ) : (
                filteredDocs.map((doc) => (
                  <ListItem key={doc.id} disablePadding>
                    <ListItemButton
                      selected={selectedDoc?.id === doc.id}
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={`Modified: ${new Date(doc.modifiedTime).toLocaleDateString()}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          )}
          
          {selectedDoc && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Document:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDoc.name}
              </Typography>
            </Box>
          )}
          
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
          onClick={handleCreateDocument}
          variant="contained"
          disabled={loading || !selectedDoc}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleDocSelectionDialog;
