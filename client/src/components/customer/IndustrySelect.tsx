import React, { useState, useMemo } from 'react';
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
import { Close, Search, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import industriesStore from '@/stores/industries.store';
import { INDUSTRIES as FALLBACK_INDUSTRIES } from '@/constants/industries';

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  label?: string;
  placeholder?: string;
  clearableIcon?: boolean;
  onClear?: () => void;
}

const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  size = 'small',
  fullWidth = true,
  label = 'Industry',
  placeholder = 'Select industry',
  clearableIcon = false,
  onClear,
}) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'Other') {
      setShowOtherInput(true);
      const baseList = industriesStore.industries.length ? industriesStore.industries : (FALLBACK_INDUSTRIES as unknown as string[]);
      setOtherValue(value && !baseList.includes(value) ? value : '');
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

  const sourceIndustries = industriesStore.industries.length ? industriesStore.industries : (FALLBACK_INDUSTRIES as unknown as string[]);
  // Ensure "Other" is always present in the dropdown options
  const withOther = Array.from(new Set([ 'Other', ...sourceIndustries ]));
  const filteredIndustries = withOther.filter(industry =>
    industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const orderedFilteredIndustries = useMemo(() => {
    const others = filteredIndustries.filter(i => i === 'Other');
    const rest = filteredIndustries.filter(i => i !== 'Other');
    return [...others, ...rest];
  }, [filteredIndustries]);

  if (showOtherInput) {
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: -30, left: 0, display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
          <Chip
            label="Other"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 1, height: 20 }}
          />
          <IconButton
            size="small"
            onClick={handleCloseOther}
            sx={{ p: 0.25 }}
          >
            <Close fontSize="inherit" />
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
    <FormControl fullWidth={fullWidth} size={size} error={error} sx={{ position: 'relative' }}>
      <InputLabel>{label}</InputLabel>
      {/* Replace chevron with clear icon when value present and clearableIcon is true */}
      <Select
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        label={label}
        sx={{
          height: 40,
          '& .MuiSelect-icon': {
            display: clearableIcon && value ? 'none' : 'block'
          }
        }}
        open={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        IconComponent={ArrowDropDownIcon}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300
            }
          },
          MenuListProps: {
            autoFocusItem: false
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
            onKeyDown={(e) => e.stopPropagation()}
            autoFocus
          />
        </Box>
        
        {orderedFilteredIndustries.map((industry) => (
          <MenuItem key={industry} value={industry}>
            {industry}
          </MenuItem>
        ))}
        
        {orderedFilteredIndustries.length === 0 && (
          <MenuItem disabled>
            No industries found
          </MenuItem>
        )}
      </Select>
      {clearableIcon && value && (
        <Box
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); onClear?.(); }}
        >
          <Close fontSize="small" />
        </Box>
      )}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default IndustrySelect;
