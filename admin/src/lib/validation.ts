// Input validation utilities for admin forms

/**
 * Validates that a string contains only numeric characters and decimal points
 */
export const isNumericInput = (value: string): boolean => {
  if (value === '') return true; // Empty string is valid for optional fields
  const numericRegex = /^-?\d*\.?\d*$/;
  return numericRegex.test(value);
};

/**
 * Validates and formats numeric input for currency/price fields
 */
export const validateCurrencyInput = (value: string): string => {
  // Remove any non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^-\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleaned;
};

/**
 * Validates integer input (no decimals)
 */
export const validateIntegerInput = (value: string): string => {
  return value.replace(/[^-\d]/g, '');
};

/**
 * Validates positive numeric input (no negative values)
 */
export const validatePositiveNumber = (value: string): string => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

/**
 * Converts string input to number, handling empty strings
 */
export const safeParseNumber = (value: string, defaultValue: number = 0): number => {
  if (value === '' || value === undefined || value === null) {
    return defaultValue;
  }
  const parsed = Number(value);
  return isFinite(parsed) ? parsed : defaultValue;
};

/**
 * Formats number for display in input fields
 */
export const formatNumberForInput = (value: number | string, emptyDefault: boolean = true): string => {
  if (value === 0 && emptyDefault) return '';
  if (value === undefined || value === null || value === '') return '';
  return String(value);
};
