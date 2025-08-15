// components/YesNoModal/YesNoModal.styles.ts
import { styled } from '@mui/material/styles';
import { Dialog } from '@mui/material';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    minWidth: 400,
    maxWidth: 600,
  },
}));
