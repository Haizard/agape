/**
 * Safely converts any value to a string representation
 * Handles objects, arrays, null, undefined, and primitive types
 * 
 * @param {any} value - The value to stringify
 * @returns {string} - A string representation of the value
 */
export const safeStringify = (value) => {
  // Handle null and undefined
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  // Handle React elements (pass through unchanged)
  if (value && value.$$typeof && value.$$typeof.toString() === 'Symbol(react.element)') {
    return value;
  }
  
  // Handle DOM elements
  if (value instanceof Element) {
    return '[DOM Element]';
  }
  
  // Handle objects (including arrays)
  if (typeof value === 'object') {
    // MongoDB documents with _id
    if (value._id) {
      if (value.name) {
        return value.name;
      } else if (value.firstName && value.lastName) {
        return `${value.firstName} ${value.lastName}`;
      } else if (value.code) {
        return value.code;
      } else if (typeof value._id === 'string') {
        return value._id;
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => safeStringify(item)).join(', ');
    }
    
    // Handle dates
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Handle other objects
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('Error stringifying object:', error);
      return '[Object]';
    }
  }
  
  // Handle functions
  if (typeof value === 'function') {
    return '[Function]';
  }
  
  // Handle symbols
  if (typeof value === 'symbol') {
    return value.toString();
  }
  
  // For primitive types (string, number, boolean)
  return String(value);
};

export default safeStringify;
