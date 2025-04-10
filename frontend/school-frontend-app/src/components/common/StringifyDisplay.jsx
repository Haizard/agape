import React from 'react';

/**
 * A simple component that converts any value to a string before rendering
 * This is a last resort solution for the "Objects are not valid as a React child" errors
 */
const StringifyDisplay = ({ value }) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // If it's already a string, number, or boolean, return as is
  if (typeof value !== 'object') {
    return String(value);
  }

  // If it's a React element, return as is
  if (React.isValidElement(value)) {
    return value;
  }

  // Handle MongoDB documents with _id
  if (value && value._id) {
    if (value.name) {
      return String(value.name);
    }
    if (value.firstName && value.lastName) {
      return `${String(value.firstName)} ${String(value.lastName)}`;
    }
    if (value.code) {
      return String(value.code);
    }
    return String(value._id);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item);
      }
      return String(item);
    }).join(', ');
  }

  // For other objects, convert to JSON string
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '[Object]';
  }
};

export default StringifyDisplay;
