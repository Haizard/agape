import React from 'react';
import PropTypes from 'prop-types';

/**
 * SafeDisplay component for safely displaying values that might be undefined, null, or objects
 * @param {Object} props - Component props
 * @param {any} props.value - The value to display
 * @param {string} props.fallback - Fallback text to display if value is undefined or null
 * @returns {React.ReactNode} - The rendered component
 */
const SafeDisplay = ({ value, fallback = '-' }) => {
  // Handle undefined, null, or empty values
  if (value === undefined || value === null || value === '') {
    return <>{fallback}</>;
  }

  // Handle objects (including arrays)
  if (typeof value === 'object') {
    // If it's an object with _id, firstName, lastName (student object)
    if (value._id && value.firstName && value.lastName) {
      return <>{`${value.firstName} ${value.lastName}`}</>;
    }

    // If it's an object with _id, name, type (exam or subject object)
    if (value._id && value.name) {
      return <>{value.name}</>;
    }

    // For other objects, convert to string representation
    try {
      return <>{JSON.stringify(value)}</>;
    } catch (e) {
      console.error('Error stringifying object:', e);
      return <>{fallback}</>;
    }
  }

  // For primitive values (string, number, boolean)
  return <>{value}</>;
};

SafeDisplay.propTypes = {
  value: PropTypes.any,
  fallback: PropTypes.string
};

export default SafeDisplay;
