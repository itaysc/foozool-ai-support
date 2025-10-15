import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { IDocument } from '@/services/documents-service';

interface DocumentViewModalProps {
  open: boolean;
  onClose: () => void;
  document: IDocument | null;
}

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  open,
  onClose,
  document,
}) => {
  if (!document) return null;

  const getDocumentTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'meeting_summary':
        return 'primary';
      case 'note':
        return 'secondary';
      case 'report':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {document.title}
          </Typography>
          <Chip
            label={document.documentType.replace('_', ' ')}
            color={getDocumentTypeColor(document.documentType)}
            size="small"
          />
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Document Metadata */}
        <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {formatDate(document.createdAt)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {formatDate(document.updatedAt)}
            </Typography>
          </Box>
          {document.meetingDate && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Meeting Date
              </Typography>
              <Typography variant="body2">
                {formatDate(document.meetingDate)}
              </Typography>
            </Box>
          )}
          {document.meetingType && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Meeting Type
              </Typography>
              <Typography variant="body2">
                {document.meetingType.replace('_', ' ')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Document Content */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
            backgroundColor: '#fafafa',
            minHeight: 400,
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              marginTop: 2,
              marginBottom: 1,
              fontWeight: 600,
            },
            '& h1': { fontSize: '2rem' },
            '& h2': { fontSize: '1.5rem' },
            '& h3': { fontSize: '1.25rem' },
            '& p': {
              marginBottom: 1,
            },
            '& ul, & ol': {
              marginLeft: 3,
              marginBottom: 1,
            },
            '& li': {
              marginBottom: 0.5,
            },
            '& hr': {
              margin: '16px 0',
              borderColor: 'divider',
            },
            '& .mention': {
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 500,
            },
            '& strong': {
              fontWeight: 600,
            },
            '& em': {
              fontStyle: 'italic',
            },
            '& ul[data-type="taskList"]': {
              listStyle: 'none',
              marginLeft: 0,
              paddingLeft: 0,
            },
            '& ul[data-type="taskList"] li': {
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: 0.5,
            },
            '& ul[data-type="taskList"] li > label': {
              marginRight: 1,
            },
            '& ul[data-type="taskList"] li > div': {
              flex: 1,
            },
          }}
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewModal;

