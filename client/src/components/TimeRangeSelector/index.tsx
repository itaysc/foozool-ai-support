import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Popover,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subMinutes, subHours, subDays, subWeeks } from 'date-fns';
import { AccessTime, CalendarToday, ExpandMore } from '@mui/icons-material';

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

interface TimeRangeSelectorProps {
  onTimeRangeChange: (timeRange: TimeRange) => void;
  currentTimeRange?: TimeRange;
}

const quickOptions = [
  { label: '15m', value: 15, unit: 'minutes' },
  { label: '30m', value: 30, unit: 'minutes' },
  { label: '1h', value: 1, unit: 'hours' },
  { label: '4h', value: 4, unit: 'hours' },
  { label: '1d', value: 1, unit: 'days' },
  { label: '3d', value: 3, unit: 'days' },
  { label: '5d', value: 5, unit: 'days' },
  { label: '1w', value: 1, unit: 'weeks' },
  { label: '2w', value: 2, unit: 'weeks' },
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ 
  onTimeRangeChange, 
  currentTimeRange 
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(
    currentTimeRange?.start || subDays(new Date(), 7)
  );
  const [customEndDate, setCustomEndDate] = useState<Date | null>(
    currentTimeRange?.end || new Date()
  );
  const [activeTab, setActiveTab] = useState(0);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleQuickOptionClick = (option: typeof quickOptions[0]) => {
    const now = new Date();
    let startDate: Date;

    switch (option.unit) {
      case 'minutes':
        startDate = subMinutes(now, option.value);
        break;
      case 'hours':
        startDate = subHours(now, option.value);
        break;
      case 'days':
        startDate = subDays(now, option.value);
        break;
      case 'weeks':
        startDate = subWeeks(now, option.value);
        break;
      default:
        startDate = subDays(now, 1);
    }

    const timeRange: TimeRange = {
      start: startDate,
      end: now,
      label: option.label
    };

    onTimeRangeChange(timeRange);
    handleClose();
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      const timeRange: TimeRange = {
        start: customStartDate,
        end: customEndDate,
        label: `${format(customStartDate, 'yyyy-MM-dd')} - ${format(customEndDate, 'yyyy-MM-dd')}`
      };
      onTimeRangeChange(timeRange);
      handleClose();
    }
  };

  const isCustomValid = customStartDate && customEndDate && customStartDate < customEndDate;

  return (
    <Box sx={{ mb: 3 }}>
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<AccessTime />}
        endIcon={<ExpandMore />}
        sx={{
          minWidth: 'auto',
          px: 2,
          py: 1,
          fontSize: '0.875rem',
          borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': {
            borderColor: 'primary.main',
            color: 'primary.main'
          }
        }}
      >
        {currentTimeRange ? currentTimeRange.label : 'Last 7 days'}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxWidth: 400,
            p: 2
          }
        }}
      >
        <Box>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2, minHeight: 'auto' }}
          >
            <Tab label="Quick" sx={{ minHeight: 'auto', py: 1, fontSize: '0.875rem' }} />
            <Tab label="Custom" sx={{ minHeight: 'auto', py: 1, fontSize: '0.875rem' }} />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {quickOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="text"
                    size="small"
                    onClick={() => handleQuickOptionClick(option)}
                    sx={{ 
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={1}>
                  <DatePicker
                    label="Start Date"
                    value={customStartDate}
                    onChange={(newValue) => setCustomStartDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: customStartDate && customEndDate && customStartDate >= customEndDate
                      }
                    }}
                  />
                  <DatePicker
                    label="End Date"
                    value={customEndDate}
                    onChange={(newValue) => setCustomEndDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: customStartDate && customEndDate && customStartDate >= customEndDate
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCustomApply}
                    disabled={!isCustomValid}
                    sx={{ mt: 1 }}
                  >
                    Apply
                  </Button>
                  {customStartDate && customEndDate && customStartDate >= customEndDate && (
                    <Typography variant="caption" color="error">
                      End date must be after start date
                    </Typography>
                  )}
                </Stack>
              </LocalizationProvider>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default TimeRangeSelector; 