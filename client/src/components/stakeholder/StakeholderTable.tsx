import React, { useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Email,
  Phone,
  LinkedIn,
} from '@mui/icons-material';
import { observer } from 'mobx-react';
import { Stakeholder } from '@/services/stakeholders-service';
import toast from '@/utils/toast';

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Email copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    toast.error('Failed to copy email');
  }
};

interface StakeholderTableProps {
  stakeholders: Stakeholder[];
  isLoading: boolean;
  error: string | null;
  customerId: string;
  onEdit: (stakeholder: Stakeholder) => void;
  onDelete: (stakeholderId: string) => Promise<void>;
  onAdd: () => void;
}

const StakeholderTable: React.FC<StakeholderTableProps> = ({
  stakeholders,
  isLoading,
  error,
  customerId,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState<Stakeholder | null>(null);

  const handleDeleteClick = (stakeholder: Stakeholder) => {
    setStakeholderToDelete(stakeholder);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (stakeholderToDelete) {
      try {
        await onDelete(stakeholderToDelete._id);
        toast.success('Stakeholder deleted successfully');
      } catch (error) {
        console.error('Failed to delete stakeholder:', error);
        toast.error('Failed to delete stakeholder. Please try again.');
      }
    }
    setDeleteDialogOpen(false);
    setStakeholderToDelete(null);
  };


  const getStakeholderTypeColor = (type?: string) => {
    switch (type) {
      case 'primary': return 'primary';
      case 'secondary': return 'default';
      case 'technical': return 'info';
      case 'business': return 'success';
      default: return 'default';
    }
  };

  const getEngagementLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Stakeholders ({stakeholders.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          size="small"
        >
          Add Stakeholder
        </Button>
      </Box>


      {/* Table */}
      {stakeholders.length === 0 ? (
        <Alert severity="info">
          No stakeholders found. Add stakeholders to track key contacts and decision makers.
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Engagement</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stakeholders.map((stakeholder) => (
              <TableRow key={stakeholder._id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {stakeholder.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {stakeholder.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {stakeholder.department}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={stakeholder.stakeholderType || 'secondary'}
                    color={getStakeholderTypeColor(stakeholder.stakeholderType)}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={stakeholder.engagement?.level || 'medium'}
                    color={getEngagementLevelColor(stakeholder.engagement?.level)}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {stakeholder.contact.email && (
                      <Tooltip title={`Click to copy: ${stakeholder.contact.email}`}>
                        <IconButton 
                          size="medium" 
                          color="primary"
                          onClick={() => copyToClipboard(stakeholder.contact.email)}
                        >
                          <Email sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {stakeholder.contact.phone && (
                      <Tooltip title={stakeholder.contact.phone}>
                        <IconButton size="medium" color="primary">
                          <Phone sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {stakeholder.contact.linkedin && (
                      <Tooltip title="LinkedIn Profile">
                        <IconButton 
                          size="medium" 
                          color="primary"
                          onClick={() => window.open(stakeholder.contact.linkedin, '_blank')}
                        >
                          <LinkedIn sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {stakeholder.createdAt ? formatDate(stakeholder.createdAt) : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit Stakeholder">
                      <IconButton
                        size="medium"
                        color="primary"
                        onClick={() => onEdit(stakeholder)}
                      >
                        <Edit sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Stakeholder">
                      <IconButton
                        size="medium"
                        color="error"
                        onClick={() => handleDeleteClick(stakeholder)}
                      >
                        <Delete sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Stakeholder</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{stakeholderToDelete?.name}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default observer(StakeholderTable);
