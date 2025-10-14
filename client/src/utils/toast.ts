import { enqueueSnackbar, OptionsObject } from 'notistack';

/**
 * Toast utility for showing notifications throughout the app
 * 
 * Usage examples:
 * - toast.success('Operation completed successfully')
 * - toast.error('Something went wrong')
 * - toast.warning('Please check your input')
 * - toast.info('Information message')
 * 
 * The SnackbarProvider is already set up in App.jsx
 */
export const toast = {
  success: (message: string, options?: OptionsObject) => {
    enqueueSnackbar(message, { 
      variant: 'success', 
      autoHideDuration: 3000,
      persist: false,
      ...options 
    });
  },
  
  error: (message: string, options?: OptionsObject) => {
    enqueueSnackbar(message, { 
      variant: 'error', 
      autoHideDuration: 5000,
      persist: false,
      ...options 
    });
  },
  
  warning: (message: string, options?: OptionsObject) => {
    enqueueSnackbar(message, { 
      variant: 'warning', 
      autoHideDuration: 4000,
      persist: false,
      ...options 
    });
  },
  
  info: (message: string, options?: OptionsObject) => {
    enqueueSnackbar(message, { 
      variant: 'info', 
      autoHideDuration: 3000,
      persist: false,
      ...options 
    });
  }
};

export default toast;
