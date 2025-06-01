import React, { useMemo, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Menu,
  SelectChangeEvent,
  OutlinedInput,
} from "@mui/material";

interface SelectFieldProps {
  name: string;
  label: string;
  onChange: (event: SelectChangeEvent) => void;
  options: string[];
  value: any;
  showAddBtn?: boolean;
  addLabel?: string;
  onAddClick?: () => void;
  searchable?: boolean;
  disabled?: boolean;
}

const SelectField = ({
  name,
  label,
  onChange,
  options,
  value,
  showAddBtn,
  addLabel,
  onAddClick,
  searchable = false,
  disabled = false,
}: SelectFieldProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const labelId = `${name}-label`;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm(""); // reset search on close
  };

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "__add__") {
      onAddClick?.();
    } else {
      const fakeEvent = {
        target: {
          name,
          value: selectedValue,
        },
      } as any;
      onChange(fakeEvent);
    }
    handleClose();
  };

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  return (
    <Box flex="1 1 48%">
      <FormControl fullWidth variant="outlined" size="small" margin="normal" disabled={disabled}>
        <InputLabel id={labelId}>{label}</InputLabel>
        <OutlinedInput
          label={label}
          value={value || ""}
          onClick={handleClick}
          readOnly
        />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{ style: { maxHeight: 300, width: anchorEl?.clientWidth } }}
        >
          {searchable && (
            <Box p={1}>
                <TextField
                size="small"
                fullWidth
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} // <-- Add this
                autoFocus
              />
            </Box>
          )}
          {showAddBtn && (
            <MenuItem value="__add__" onClick={() => handleSelect("__add__")} style={{ fontStyle: "italic", color: "#1976d2" }}>
              + {addLabel}
            </MenuItem>
          )}
          {filteredOptions.map((option) => (
            <MenuItem key={option} value={option} onClick={() => handleSelect(option)}>
              {option}
            </MenuItem>
          ))}
        </Menu>
      </FormControl>
    </Box>
  );
};

export default SelectField;
