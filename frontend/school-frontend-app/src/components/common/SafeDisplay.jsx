import React from 'react';
import PropTypes from 'prop-types';
import { safeRender } from '../../utils/safeRender';

/**
 * A component that safely renders any value, including objects
 * Use this component to prevent "Objects are not valid as a React child" errors
 *
 * @param {Object} props - Component props
 * @param {any} props.value - The value to render safely
 * @param {string} props.fallback - Fallback text if value is null/undefined
 * @returns {string} - The safely rendered value as a string
 */
const SafeDisplay = ({ value, fallback = '' }) => {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return String(fallback);
  }

  // If it's a React element, return as is
  if (React.isValidElement(value)) {
    return value;
  }

  // If it's an object, use our utility function to safely render it
  if (typeof value === 'object') {
    return String(safeRender(value));
  }

  // For primitive types, convert to string
  return String(value);
};

SafeDisplay.propTypes = {
  value: PropTypes.any,
  fallback: PropTypes.string
};

export default SafeDisplay;
