import styled from 'styled-components';
import theme from '@/styles/theme';

export const FixedFooterWrapper = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 70px;
  background-color: ${theme.colors.grey[200]};
  border-top: 1px solid ${theme.colors.text.dark};
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  z-index: 1000;
`;