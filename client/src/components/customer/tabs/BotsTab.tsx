import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { observer } from 'mobx-react';
import Modal from '@/components/Modal';
import botsStore from '@/stores/bots.store';

interface BotsTabProps {
  mode: 'create' | 'edit';
}

const BotsTab: React.FC<BotsTabProps> = ({
  mode,
}) => {
  const [addBotOpen, setAddBotOpen] = useState(false);
  const [newBot, setNewBot] = useState<{ name: string; type: 'customer_success' }>({ 
    name: '', 
    type: 'customer_success' 
  });

  const handleCreateBot = async () => {
    if (!newBot.name.trim()) return;
    await botsStore.create({ name: newBot.name.trim(), type: newBot.type });
    setAddBotOpen(false);
    setNewBot({ name: '', type: 'customer_success' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Configure AI Bots</Typography>
        <Button variant="text" onClick={() => setAddBotOpen(true)}>+ Add Bot</Button>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Existing Bots</Typography>
        {botsStore.isLoading ? (
          <CircularProgress size={24} />
        ) : botsStore.items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No bots yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {botsStore.items.map((b) => (
                <TableRow key={b._id}>
                  <TableCell>{b.name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {b.type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>{new Date(b.createdAt).toISOString().split('T')[0]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Add Bot Modal */}
      <Modal
        open={addBotOpen}
        onClose={() => setAddBotOpen(false)}
        title="Add Bot"
        maxWidth="sm"
        contentTopGap={3}
        actions={
          <>
            <Button onClick={() => setAddBotOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateBot}
              disabled={botsStore.isSaving}
            >
              {botsStore.isSaving ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Create bots that generate specific insights.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Bot Name"
            value={newBot.name}
            onChange={(e) => setNewBot(prev => ({ ...prev, name: e.target.value }))}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Bot Type</InputLabel>
            <Select
              label="Bot Type"
              value={newBot.type}
              onChange={(e) => setNewBot(prev => ({ ...prev, type: e.target.value as any }))}
              sx={{ height: 40 }}
            >
              <MenuItem value="customer_success">Customer Success Insights</MenuItem>
              <MenuItem value="issue_insights">Issue Insights</MenuItem>
              <MenuItem value="predictions">Predictions</MenuItem>
              <MenuItem value="nps">NPS Insights</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Modal>
    </Box>
  );
};

export default observer(BotsTab);
