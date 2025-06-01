import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography } from '@mui/material';
import { useState } from 'react';
import currencyCodes from './codes';

interface CurrencyPickerProps {
  onChange?: (event: SelectChangeEvent) => void;
  label?: string;
  disabled?: boolean;
  name?: string;
}

const currencies = currencyCodes.map((currency) => ({
  code: currency,
  name: currency,
}));

const CurrencyPicker = ({
  onChange,
  name,
  label = 'Currency',
  disabled = false,
}: CurrencyPickerProps) => {
  const [value, setValue] = useState( 'USD');

  const handleChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    setValue(newValue);
    onChange?.(event);
  };

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id={`${name}-select-label`}>{label}</InputLabel>
      <Select
        name={name}
        labelId={`${name}-select-label`}
        id={`${name}-select`}
        value={value}
        size="small"
        label={label}
        onChange={handleChange}
      >
        {currencies.map((currency) => (
          <MenuItem key={currency.code} value={currency.code}>
            {currency.code}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}; 

export default CurrencyPicker;