/**
 * Report Format Utilities
 * 
 * Provides utility functions for formatting report data consistently
 * without implementing any calculation logic.
 */

/**
 * Format a number with a specified number of decimal places
 * @param {number|string} value - The value to format
 * @param {number} [decimalPlaces=1] - Number of decimal places
 * @param {string} [fallback='N/A'] - Fallback value if input is invalid
 * @returns {string} - Formatted number or fallback value
 */
export const formatNumber = (value, decimalPlaces = 1, fallback = 'N/A') => {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  // Convert to number
  const num = Number(value);
  
  // Check if it's a valid number
  if (isNaN(num)) {
    return fallback;
  }
  
  // Format with specified decimal places
  return num.toFixed(decimalPlaces);
};

/**
 * Format a division value consistently
 * @param {string} division - Division value (e.g., 'I', 'II', 'Division I')
 * @param {string} [fallback='N/A'] - Fallback value if input is invalid
 * @returns {string} - Formatted division (e.g., 'Division I')
 */
export const formatDivision = (division, fallback = 'N/A') => {
  // Handle null, undefined, empty string
  if (division === null || division === undefined || division === '') {
    return fallback;
  }
  
  // If already in 'Division X' format, return as is
  if (typeof division === 'string' && division.startsWith('Division ')) {
    return division;
  }
  
  // Otherwise, add 'Division ' prefix
  return `Division ${division}`;
};

/**
 * Get color for a grade
 * @param {string} grade - Grade value (A, B, C, D, E, S, F)
 * @returns {string} - MUI color name
 */
export const getGradeColor = (grade) => {
  switch (grade) {
    case 'A': return 'success';
    case 'B': return 'success';
    case 'C': return 'primary';
    case 'D': return 'warning';
    case 'E': return 'warning';
    case 'S': return 'warning';
    case 'F': return 'error';
    default: return 'default';
  }
};

/**
 * Get color for a division
 * @param {string} division - Division value (I, II, III, IV, 0)
 * @returns {string} - MUI color name
 */
export const getDivisionColor = (division) => {
  // Extract division number if in 'Division X' format
  const divisionValue = division.replace('Division ', '');
  
  switch (divisionValue) {
    case 'I': return 'success';
    case 'II': return 'primary';
    case 'III': return 'info';
    case 'IV': return 'warning';
    default: return 'error';
  }
};

/**
 * Format a rank value with total students
 * @param {number|string} rank - Rank value
 * @param {number|string} totalStudents - Total number of students
 * @param {string} [fallback='N/A'] - Fallback value if input is invalid
 * @returns {string} - Formatted rank (e.g., '1/30')
 */
export const formatRank = (rank, totalStudents, fallback = 'N/A') => {
  // Handle invalid inputs
  if (
    rank === null || rank === undefined || rank === '' ||
    totalStudents === null || totalStudents === undefined || totalStudents === ''
  ) {
    return fallback;
  }
  
  // Convert to numbers
  const rankNum = Number(rank);
  const totalNum = Number(totalStudents);
  
  // Check if they're valid numbers
  if (isNaN(rankNum) || isNaN(totalNum)) {
    return fallback;
  }
  
  // Format as 'rank/total'
  return `${rankNum}/${totalNum}`;
};

/**
 * Get color for a rank
 * @param {number|string} rank - Rank value
 * @returns {string} - MUI color name
 */
export const getRankColor = (rank) => {
  // Convert to number
  const rankNum = Number(rank);
  
  // Check if it's a valid number
  if (isNaN(rankNum)) {
    return 'default';
  }
  
  // Assign color based on rank
  if (rankNum <= 3) {
    return 'success';
  } else if (rankNum <= 10) {
    return 'primary';
  } else if (rankNum <= 20) {
    return 'info';
  } else {
    return 'default';
  }
};

// Export all utilities
const reportFormatUtils = {
  formatNumber,
  formatDivision,
  getGradeColor,
  getDivisionColor,
  formatRank,
  getRankColor
};

export default reportFormatUtils;
