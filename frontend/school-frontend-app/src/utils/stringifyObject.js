/**
 * Safely converts any object to a string representation
 * Use this function to prevent "Objects are not valid as a React child" errors
 * 
 * @param {any} value - The value to stringify
 * @returns {string} - A string representation of the value
 */
export const stringifyObject = (value) => {
  // Handle null/undefined
  if (value === null) return '';
  if (value === undefined) return '';
  
  // If it's already a string, number, or boolean, return as is
  if (typeof value !== 'object') return String(value);
  
  // Handle React elements (return as is)
  if (value?.$$typeof?.toString() === 'Symbol(react.element)') {
    return value;
  }
  
  // Handle MongoDB documents with _id
  if (value._id) {
    if (value.name) return value.name;
    if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`;
    if (value.code) return value.code;
    return String(value._id);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => stringifyObject(item)).join(', ');
  }
  
  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  // For other objects, convert to JSON string
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[Object]';
  }
};

export default stringifyObject;
