import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

/**
 * Division Chip Component
 * Displays a division with appropriate color coding
 * 
 * @param {Object} props - Component props
 * @param {string} props.division - The division to display (I, II, III, IV, V, 0)
 * @param {string} props.educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @param {Object} props.chipProps - Additional props for the Chip component
 */
const DivisionChip = ({ division, educationLevel = 'A_LEVEL', chipProps = {} }) => {
  // Normalize division format
  const normalizeDivision = () => {
    if (!division) return '0';
    
    // Handle different division formats
    if (typeof division === 'string' && division.includes('Division')) {
      return division.replace('Division ', '');
    }
    
    return division;
  };

  // Get color based on division
  const getColor = () => {
    const normalizedDivision = normalizeDivision();
    
    switch (normalizedDivision) {
      case 'I': return 'success';
      case 'II': return 'primary';
      case 'III': return 'info';
      case 'IV': return 'warning';
      case 'V': return educationLevel === 'A_LEVEL' ? 'warning' : 'error';
      case '0': return 'error';
      default: return 'default';
    }
  };

  // Get label based on division
  const getLabel = () => {
    const normalizedDivision = normalizeDivision();
    
    if (normalizedDivision === '0') {
      return 'No Division';
    }
    
    return `Division ${normalizedDivision}`;
  };

  return (
    <Chip
      label={getLabel()}
      color={getColor()}
      size="small"
      {...chipProps}
    />
  );
};

DivisionChip.propTypes = {
  division: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  educationLevel: PropTypes.oneOf(['O_LEVEL', 'A_LEVEL']),
  chipProps: PropTypes.object
};

export default DivisionChip;
