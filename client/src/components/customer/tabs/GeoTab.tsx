import React from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';
import { CreateCustomerRequest } from '@/types';
import SelectBase from '@/components/base/Select';
import { COUNTRIES } from '@/constants/countries';
import { REGIONS } from '@/constants/regions';
import { LANGUAGES } from '@/constants/languages';

interface GeoTabProps {
  formData: CreateCustomerRequest;
  onInputChange: (field: keyof CreateCustomerRequest, value: any) => void;
}

const GeoTab: React.FC<GeoTabProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>Geography</Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <SelectBase
          value={(formData as any).hq?.country || ''}
          onChange={(v) => onInputChange('hq' as any, { ...(formData as any).hq, country: String(v) })}
          size="small"
          fullWidth
          label="HQ Country"
          placeholder="Select country"
          searchable
          allowClear
          options={COUNTRIES}
        />
        <SelectBase
          value={(formData as any).hq?.region || ''}
          onChange={(v) => onInputChange('hq' as any, { ...(formData as any).hq, region: String(v) })}
          size="small"
          fullWidth
          label="Region"
          placeholder="Select region"
          allowClear
          options={REGIONS}
        />
        <TextField 
          fullWidth 
          size="small" 
          label="City" 
          value={(formData as any).hq?.city || ''} 
          onChange={(e) => onInputChange('hq' as any, { ...(formData as any).hq, city: e.target.value })} 
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <SelectBase
          value={(formData.operatingRegions || []) as any}
          onChange={(vals) => onInputChange('operatingRegions', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
          size="small"
          fullWidth
          label="Operating Regions"
          placeholder="Select operating regions"
          multiple
          searchable
          allowClear
          options={REGIONS}
        />
        <SelectBase
          value={(formData.countriesServed || []) as any}
          onChange={(vals) => onInputChange('countriesServed', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
          size="small"
          fullWidth
          label="Countries Served"
          placeholder="Select countries"
          multiple
          searchable
          allowClear
          options={['International', ...COUNTRIES.filter(c => c !== 'International')]}
        />
      </Box>
      
      <SelectBase
        value={(formData.languages || []) as any}
        onChange={(vals) => onInputChange('languages', (Array.isArray(vals) ? vals.map(String) : []) as string[])}
        size="small"
        fullWidth
        label="Languages"
        placeholder="Select languages"
        multiple
        searchable
        allowClear
        options={LANGUAGES}
      />
    </Box>
  );
};

export default GeoTab;
