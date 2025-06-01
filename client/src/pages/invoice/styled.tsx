import styled from 'styled-components';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import theme from '@/styles/theme';


// Wrapper for the file preview container
export const PreviewWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
`;

// Styled Paper component for the preview box
export const StyledPaper = styled(Paper)`
  width: 120px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  margin-top: 2px;
  border-radius: 8px;
  position: relative;
`;

// Styled IconButton for the remove button
export const RemoveButton = styled(IconButton)`
  position: absolute !important;
  top: 4px;
  right: 4px;
  background-color: rgba(255, 255, 255, 0.7);

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

// Styled img element for image previews
export const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// Styled component for file type icons
export const StyledIcon = styled.div<{ fileType: string }>`
  font-size: 3rem;
  color: ${({ fileType }) =>
    fileType === 'application/pdf' ? 'red' : 'inherit'};
`;


export const InvoiceContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

export const FormContainer = styled(Box)`
  width: 100%;
  max-width: 800px;
  padding: 30px;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const FormTitle = styled(Typography)`
  text-align: center;
  margin-bottom: 20px;
`;

export const FieldWrapper = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: space-between;

  & > .MuiTextField-root {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    width: 48%;
  }
`;

export const ActionBtnsContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
`;