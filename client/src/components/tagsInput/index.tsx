import React, { useMemo, useRef, useState } from 'react';
import { Box, Chip, FormControl, FormHelperText, IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';

interface TagsInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  label: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  normalize?: (token: string) => string;
}

const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Add and press comma',
  size = 'small',
  fullWidth = true,
  error,
  helperText,
  normalize,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  const addToken = (raw: string) => {
    const token = (normalize ? normalize(raw) : raw).trim();
    if (!token) return;
    if (value.includes(token)) return;
    onChange([ ...value, token ]);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault();
      addToken(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      // Remove last tag
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const onBlur = () => {
    if (draft.trim()) addToken(draft);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} error={error} sx={{ position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: -6, left: 8, backgroundColor: 'background.paper', px: 0.5, fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', pointerEvents: 'none', lineHeight: 1 }}>
        {label}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.375,
          height: 40,
          border: '1px solid rgba(0,0,0,0.23)',
          borderRadius: 1,
          px: 1.25,
          py: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          '&:focus-within': { borderColor: 'primary.main' },
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((v, idx) => (
          <Chip
            key={`${v}-${idx}`}
            size="small"
            label={v}
            onDelete={() => removeAt(idx)}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.75rem', px: 0.75 }, '& .MuiChip-deleteIcon': { fontSize: '0.9rem' } }}
          />
        ))}
        <TextField
          variant="standard"
          InputProps={{ disableUnderline: true }}
          placeholder={value.length === 0 ? placeholder : undefined}
          value={draft}
          inputRef={inputRef}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          sx={{ flex: '1 1 200px', minWidth: 160, '& .MuiInputBase-input': { fontSize: '0.875rem', py: 0 } }}
        />
      </Box>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default TagsInput;


