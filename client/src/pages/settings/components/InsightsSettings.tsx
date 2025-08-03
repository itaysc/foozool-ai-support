import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import apiService from '../../../services/api-service';

interface Insight {
  _id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'archived';
  confidence: number;
  createdAt: string;
}

interface InsightsSettingsProps {
  onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const InsightsSettings: React.FC<InsightsSettingsProps> = ({ onShowSnackbar }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    title: '',
    description: '',
    status: 'active' as 'active' | 'resolved' | 'archived',
    confidence: 0.5
  });

  const categories = ['bug_report', 'feature_request', 'user_experience', 'performance'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['active', 'resolved', 'archived'];

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await apiService.insights.getAll();
      if (response.success) {
        setInsights(response.data.insights || []);
      }
    } catch (error) {
      onShowSnackbar('Failed to fetch insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (insight?: Insight) => {
    if (insight) {
      setEditingInsight(insight);
      setFormData({
        category: insight.category,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        status: insight.status,
        confidence: insight.confidence
      });
    } else {
      setEditingInsight(null);
      setFormData({
        category: '',
        severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        title: '',
        description: '',
        status: 'active' as 'active' | 'resolved' | 'archived',
        confidence: 0.5
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInsight(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingInsight) {
        await apiService.insights.update(editingInsight._id, formData);
        onShowSnackbar('Insight updated successfully', 'success');
      } else {
        await apiService.insights.create(formData);
        onShowSnackbar('Insight created successfully', 'success');
      }
      fetchInsights();
      handleCloseDialog();
    } catch (error) {
      onShowSnackbar('Failed to save insight', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this insight?')) {
      try {
        await apiService.insights.delete(id);
        onShowSnackbar('Insight deleted successfully', 'success');
        fetchInsights();
      } catch (error) {
        onShowSnackbar('Failed to delete insight', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Insights Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Insight
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {insights.map((insight) => (
              <TableRow key={insight._id}>
                <TableCell>{insight.title}</TableCell>
                <TableCell><Chip label={insight.category} size="small" /></TableCell>
                <TableCell><Chip label={insight.severity} size="small" /></TableCell>
                <TableCell><Chip label={insight.status} size="small" /></TableCell>
                <TableCell>{(insight.confidence * 100).toFixed(1)}%</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(insight)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(insight._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingInsight ? 'Edit Insight' : 'Add New Insight'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                label="Severity"
              >
                {severities.map((severity) => (
                  <MenuItem key={severity} value={severity}>{severity}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                label="Status"
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Confidence (0-1)"
              type="number"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
              inputProps={{ min: 0, max: 1, step: 0.1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInsight ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InsightsSettings; 