/**
 * Date utility functions for formatting and manipulating dates
 */

/**
 * Format a date to a readable string
 * @param {Date} date - The date to format
 * @param {string} format - The format to use (default: 'DD/MM/YYYY')
 * @returns {string} - The formatted date string
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  // Replace format tokens with actual values
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
};

/**
 * Format a date to a long readable string
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date string (e.g., "January 1, 2023")
 */
export const formatLongDate = (date) => {
  if (!date) return '';
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Format the date using Intl.DateTimeFormat
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

/**
 * Get the academic year string based on a date
 * @param {Date} date - The date to get the academic year for
 * @returns {string} - The academic year string (e.g., "2023-2024")
 */
export const getAcademicYear = (date) => {
  if (!date) {
    date = new Date();
  }
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Academic year typically starts in September
  // If the month is before September, use the previous year as the start
  if (month < 9) {
    return `${year - 1}-${year}`;
  } else {
    return `${year}-${year + 1}`;
  }
};

export default {
  formatDate,
  formatLongDate,
  getAcademicYear
};
