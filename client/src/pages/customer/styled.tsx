import styled from 'styled-components';
import { Box } from '@mui/material';
import theme from '@/styles/theme';

export const Container = styled(Box)`
  max-width: 800px;
  margin: auto;
  margin-top: 32px;
  padding: 24px;
  background-color: ${theme.colors.background.paper};
  border-radius: 16px;
  box-shadow: ${theme.shadows[3]};
`;

export const Header = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const ButtonGroup = styled(Box)`
  display: flex;
  gap: 8px;
`;

export const FlexWrap = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const Column = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
