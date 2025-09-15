import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Chip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Clear, FilterList } from '@mui/icons-material';

export interface DateFilterState {
  fromDate: Date | null;
  toDate: Date | null;
}

interface DateFilterProps {
  onFilterChange: (filter: DateFilterState) => void;
  disabled?: boolean;
  label?: string;
}

export const DateFilter: React.FC<DateFilterProps> = ({ 
  onFilterChange, 
  disabled = false,
  label = "Filter by Date Range"
}) => {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const handleApplyFilter = () => {
    onFilterChange({ fromDate, toDate });
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    onFilterChange({ fromDate: null, toDate: null });
  };

  const hasActiveFilter = fromDate || toDate;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        p: 2, 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        backgroundColor: '#fafafa',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {hasActiveFilter && (
            <Chip 
              label="Active" 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={(newValue) => setFromDate(newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 }
              }
            }}
          />
          
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={(newValue) => setToDate(newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 }
              }
            }}
          />

          <Button
            variant="contained"
            onClick={handleApplyFilter}
            disabled={disabled}
            startIcon={<FilterList />}
            size="small"
          >
            Apply Filter
          </Button>

          {hasActiveFilter && (
            <Button
              variant="outlined"
              onClick={handleClearFilter}
              disabled={disabled}
              startIcon={<Clear />}
              size="small"
            >
              Clear
            </Button>
          )}
        </Box>

        {hasActiveFilter && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="body2" color="primary">
              <strong>Active Filter:</strong> 
              {fromDate && ` From ${fromDate.toLocaleDateString()}`}
              {toDate && ` To ${toDate.toLocaleDateString()}`}
              {!fromDate && toDate && ' All records up to'}
              {fromDate && !toDate && ' All records from'}
            </Typography>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default DateFilter;
