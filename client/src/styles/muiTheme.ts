import { createTheme } from '@mui/material/styles';
import theme from './theme';

// Create MUI theme by combining values from styled-components theme
const muiTheme = createTheme({
  palette: {
    primary: {
      main: theme.colors.primary.main,
      light: theme.colors.primary.light,
      dark: theme.colors.primary.dark,
      contrastText: theme.colors.primary.contrastText,
    },
    secondary: {
      main: theme.colors.secondary.main,
      light: theme.colors.secondary.light,
      dark: theme.colors.secondary.dark,
      contrastText: theme.colors.secondary.contrastText,
    },
    background: {
      default: theme.colors.background.default,
      paper: theme.colors.background.paper,
    },
    text: {
      primary: theme.colors.text.primary,
      secondary: theme.colors.text.secondary,
      disabled: theme.colors.text.disabled,
    },
    error: {
      main: theme.colors.error.main,
      light: theme.colors.error.light,
      dark: theme.colors.error.dark,
      contrastText: theme.colors.error.contrastText,
    },
    success: {
      main: theme.colors.success.main,
      light: theme.colors.success.light,
      dark: theme.colors.success.dark,
      contrastText: theme.colors.success.contrastText,
    },
  },
  typography: {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
    fontWeightRegular: theme.typography.fontWeight.regular,
    fontWeightBold: theme.typography.fontWeight.bold,
  },
  spacing: (factor) => `${factor * 8}px`, // Customize spacing based on your theme
});

export default muiTheme;
