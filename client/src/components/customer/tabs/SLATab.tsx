import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Stack, Chip } from '@mui/material';
import { CreateCustomerRequest } from '@/types';

interface SLATabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const SLATab: React.FC<SLATabProps> = ({ formData, onInputChange }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('days');

  const addSLA = () => {
    if (!name || !amount) return;
    const next = [ ...(formData.slas || []), { name, amount: Number(amount), unit } ];
    onInputChange('slas', next);
    setName('');
    setAmount('');
    setUnit('days');
  };

  const removeSLA = (index: number) => {
    const next = (formData.slas || []).filter((_, i) => i !== index);
    onInputChange('slas', next);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Service Level Agreements</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth />
          <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} size="small" fullWidth />
          <TextField select label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as any)} size="small" fullWidth>
            <MenuItem value="minutes">Minutes</MenuItem>
            <MenuItem value="hours">Hours</MenuItem>
            <MenuItem value="days">Days</MenuItem>
          </TextField>
          <Button variant="contained" onClick={addSLA}>Add</Button>
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Defined SLAs</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(formData.slas || []).map((s, i) => (
            <Chip key={`${s.name}-${i}`} label={`${s.name}: ${s.amount} ${s.unit}`} onDelete={() => removeSLA(i)} />
          ))}
          {(formData.slas || []).length === 0 && (
            <Typography variant="body2" color="text.secondary">No SLAs defined yet.</Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default SLATab;


