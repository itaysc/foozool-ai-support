import React, { useMemo, useRef, useState } from 'react';
import { FormControl, InputLabel, Select as MuiSelect, MenuItem, Box, FormHelperText, TextField, Chip, IconButton } from '@mui/material';
import { Close, Search, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';

type Option = { value: string | number; label: string } | string;

function optionLabel(opt: Option): string {
  return typeof opt === 'string' ? opt : String(opt.label);
}
function optionValue(opt: Option): string | number {
  return typeof opt === 'string' ? opt : opt.value;
}

interface Props {
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  label: string;
  options: Option[];
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  allowClear?: boolean;
  allowOther?: boolean;
  searchable?: boolean;
}

const Select: React.FC<Props> = ({
  value,
  onChange,
  label,
  options,
  size = 'small',
  fullWidth = true,
  error,
  helperText,
  placeholder = 'Select',
  allowClear = false,
  allowOther = false,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [otherMode, setOtherMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ordered = useMemo(() => {
    let base = options;
    if (allowOther) {
      base = ['Other', ...options.filter((o) => optionLabel(o) !== 'Other')];
    }
    return base;
  }, [options, allowOther]);

  const filtered = useMemo(() => {
    if (!searchable || !searchTerm) return ordered;
    const lower = searchTerm.toLowerCase();
    return ordered.filter((o) => optionLabel(o).toLowerCase().includes(lower));
  }, [ordered, searchable, searchTerm]);

  const handleSelectChange = (newVal: any) => {
    if (allowOther && String(newVal) === 'Other') {
      setOtherMode(true);
      onChange('');
    } else {
      setOtherMode(false);
      onChange(newVal);
    }
  };

  const clearValue = () => {
    setOtherMode(false);
    onChange('');
  };

  const isClearVisible = allowClear && (value !== '' || otherMode);

  // If in other mode, show inline text field instead of Select
  if (allowOther && (otherMode || (typeof value === 'string' && value !== '' && !ordered.some(o => optionLabel(o) === String(value))))) {
    return (
      <FormControl fullWidth={fullWidth} size={size} error={error} sx={{ position: 'relative' }}>
        {/* Absolutely positioned label row so input doesn't move */}
        <Box sx={{ position: 'absolute', top: -34, left: 0, display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <Chip label="Other" size="small" color="primary" variant="outlined" sx={{ mr: 1, height: 20 }} />
          <IconButton size="small" onClick={() => { setOtherMode(false); onChange(''); }} sx={{ p: 0.25 }}>
            <Close fontSize="inherit" />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          size={size}
          label={label}
          variant="outlined"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          sx={{ '& .MuiInputBase-root': { height: 40 } }}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth={fullWidth} size={size} error={error} sx={{ position: 'relative' }}>
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        value={value}
        label={label}
        onChange={(e) => handleSelectChange(e.target.value as any)}
        open={isOpen}
        onOpen={() => {
          setIsOpen(true);
          // Focus search input after menu opens
          setTimeout(() => {
            if (searchable) searchInputRef.current?.focus();
          }, 0);
        }}
        onClose={() => setIsOpen(false)}
        sx={{
          height: 40,
          '& .MuiSelect-icon': { display: isClearVisible ? 'none' : 'block' },
        }}
        IconComponent={ArrowDropDownIcon}
        MenuProps={{
          PaperProps: { style: { maxHeight: 300 } },
          MenuListProps: { autoFocusItem: false },
        }}
      >
        {searchable && (
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ '& .MuiInputBase-root': { height: 28, fontSize: '0.875rem' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              inputRef={searchInputRef}
            />
          </Box>
        )}
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {filtered.map((opt) => (
          <MenuItem key={String(optionLabel(opt))} value={optionValue(opt)}>
            {optionLabel(opt)}
          </MenuItem>
        ))}
      </MuiSelect>
      {isClearVisible && (
        <Box
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearValue(); }}
        >
          <Close fontSize="small" />
        </Box>
      )}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default Select;


