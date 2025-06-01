import styled from 'styled-components';
import { MenuItem as MuiMenuItem, Typography } from '@mui/material';
import theme from '@/styles/theme';

export const MenuItem = styled(MuiMenuItem)`
  font-size: ${theme.typography.fontSize.md};
`;

export const SubText = styled(Typography)`
  font-size: ${theme.typography.fontSize.sm};
`;