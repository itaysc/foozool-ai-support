import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Chip,
  IconButton,
  FormHelperText,
  OutlinedInput
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { INDUSTRIES } from '@/constants/industries';

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  label?: string;
  placeholder?: string;
}

const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  size = 'small',
  fullWidth = true,
  label = 'Industry',
  placeholder = 'Select industry'
}) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setShowOtherInput(true);
      setOtherValue(value && !(INDUSTRIES as readonly string[]).includes(value) ? value : '');
      onChange(selectedValue);
    } else {
      setShowOtherInput(false);
      setOtherValue('');
      onChange(selectedValue);
    }
  };

  const handleOtherInputChange = (inputValue: string) => {
    setOtherValue(inputValue);
    onChange(inputValue);
  };

  const handleCloseOther = () => {
    setShowOtherInput(false);
    setOtherValue('');
    onChange('');
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredIndustries = INDUSTRIES.filter(industry =>
    industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showOtherInput) {
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip
            label="Other"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <IconButton
            size="small"
            onClick={handleCloseOther}
            sx={{ p: 0.5 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <TextField
          fullWidth={fullWidth}
          size={size}
          label={label}
          value={otherValue}
          onChange={(e) => handleOtherInputChange(e.target.value)}
          placeholder="Enter custom industry"
          error={error}
          helperText={helperText}
          sx={{ '& .MuiInputBase-root': { height: 40 } }}
        />
      </Box>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} size={size} error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        label={label}
        sx={{ height: 40 }}
        open={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300
            }
          }
        }}
      >
        {/* Search input at the top */}
        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ 
              '& .MuiInputBase-root': { 
                height: 20,
                fontSize: '0.875rem'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
        
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        
        {filteredIndustries.map((industry) => (
          <MenuItem key={industry} value={industry}>
            {industry}
          </MenuItem>
        ))}
        
        {filteredIndustries.length === 0 && (
          <MenuItem disabled>
            No industries found
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default IndustrySelect;
