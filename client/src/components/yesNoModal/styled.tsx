// components/YesNoModal/YesNoModal.styles.ts
import styled from 'styled-components';
import { Dialog } from '@mui/material';

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    border-radius: 16px;
    padding: 16px;
    min-width: 300px;
  }

  .MuiDialogTitle-root {
    font-weight: 600;
  }

  .MuiDialogActions-root {
    justify-content: space-between;
  }
`;
