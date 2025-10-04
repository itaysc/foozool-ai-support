import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CreateCustomerRequest } from '@/types';
import SelectBase from '@/components/base/Select';
import TagsInput from '@/components/tagsInput';
import { EXCHANGES } from '@/constants/exchanges';

interface MediaTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Media & Signals</Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField 
          fullWidth 
          size="small" 
          label="Website" 
          value={formData.website || ''} 
          onChange={(e) => onInputChange('website', e.target.value)} 
        />
        <TagsInput
          value={(formData.domains || [])}
          onChange={(vals) => onInputChange('domains', vals)}
          label="Domains"
          placeholder="Domains (Comma-Separated)"
          normalize={(t) => t.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Public Listing</InputLabel>
          <Select 
            label="Public Listing" 
            value={(formData.publicListing?.isPublic ? 'public' : 'private') as any} 
            onChange={(e) => onInputChange('publicListing' as any, { ...(formData as any).publicListing, isPublic: e.target.value === 'public' })}
          >
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="public">Public</MenuItem>
          </Select>
        </FormControl>
        <TextField 
          size="small" 
          label="Ticker" 
          value={(formData.publicListing?.ticker) || ''} 
          onChange={(e) => onInputChange('publicListing' as any, { ...(formData as any).publicListing, ticker: e.target.value })} 
        />
        <SelectBase
          value={(formData.publicListing?.exchange) || ''}
          onChange={(v) => onInputChange('publicListing' as any, { ...(formData as any).publicListing, exchange: String(v) })}
          size="small"
          label="Exchange"
          placeholder="Select exchange"
          allowClear
          searchable
          options={EXCHANGES}
        />
      </Box>
      
      <TagsInput
        value={(formData.newsKeywords || [])}
        onChange={(vals) => onInputChange('newsKeywords', vals)}
        label="News Keywords"
        placeholder="Keywords (Comma-Separated)"
      />
      
      <TagsInput
        value={(formData.excludedKeywords || [])}
        onChange={(vals) => onInputChange('excludedKeywords', vals)}
        label="Excluded Keywords"
        placeholder="Excluded Keywords (Comma-Separated)"
      />
      
      <TagsInput
        value={(formData.competitorNames || [])}
        onChange={(vals) => onInputChange('competitorNames', vals)}
        label="Competitors"
        placeholder="Competitors (Comma-Separated)"
      />
      
      <TagsInput
        value={(formData.productLines || [])}
        onChange={(vals) => onInputChange('productLines', vals)}
        label="Product Lines"
        placeholder="Product Lines (Comma-Separated)"
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TagsInput
          value={(formData.contentSources || []).map((s: any) => s?.handleOrUrl || String(s))}
          onChange={(vals) => onInputChange('contentSources', vals.map((s) => ({ type: 'custom', handleOrUrl: s })))}
          label="Content Sources (URLs/handles)"
          placeholder="Content Sources (Comma-Separated)"
          normalize={(t) => t.trim()}
        />
        <TextField 
          size="small" 
          label="Default Lookback Days" 
          type="number" 
          value={formData.mediaLookbackDaysDefault ?? 30} 
          onChange={(e) => onInputChange('mediaLookbackDaysDefault', e.target.value === '' ? undefined : Number(e.target.value))} 
        />
      </Box>
    </Box>
  );
};

export default MediaTab;
