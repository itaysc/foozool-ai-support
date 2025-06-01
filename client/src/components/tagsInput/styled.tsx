import styled from 'styled-components';
import theme from '@/styles/theme';
import { Box } from '@mui/material';

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 6px;
  border: 1px solid ${theme.colors.primary.main};
  border-radius: 4px;
  min-height: 42px;
`;

export const TagBox = styled.div`
  position: relative;
  background-color: ${theme.colors.primary.lightRgba};
  border-radius: 2px;
  border: 1px solid ${theme.colors.primary.main};
  color: ${theme.colors.text.dark};
  font-size: 13px;
  margin: 4px 6px 4px 0;
  padding: 4px 6px;
  .tag-text {
    margin-right: 10px;
  }
`;

export const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: ${theme.colors.text.dark};
  font-size: 14px;
  margin-left: 6px;
  cursor: pointer;
  padding: 0;
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: bold;

  &:hover {
    color: ${theme.colors.primary.main};
  }
`;
export const StyledInput = styled.input`
  font-family: sans-serif;
  font-size: 14px;
  padding: 6px 4px;
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  color: black;
  position: relative;
  z-index: 2;
`;

export const GhostOverlay = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 14px;
  font-family: sans-serif;
  color: black;
  pointer-events: none;
  white-space: pre;
  z-index: 1;

  .ghost {
    color: rgba(0, 0, 0, 0.3);
  }
`;

export const InputWrapper = styled(Box)`
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  padding: 10.5px 14px; /* reduced top/bottom for small size */
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-height: 40px; /* same as MUI size="small" */
  font-size: 0.875rem; /* ~13-14px */
  transition: border 0.2s ease;
  margin-top: 10px;
  &:focus-within {
    border-color: #3f51b5;
  }
`;

export const FloatingLabel = styled.label`
  position: absolute;
  top: -6px;
  left: 8px;
  background-color: white;
  padding: 0 4px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  pointer-events: none;
  line-height: 1;
`;
