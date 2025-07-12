// Common regex patterns for validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email validation with custom error message
export const emailValidation = (errorMessage: string = 'Invalid email format') => 
  (value: string) => EMAIL_REGEX.test(value) || errorMessage;
