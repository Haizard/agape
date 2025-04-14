import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

/**
 * Grade Chip Component
 * Displays a grade with appropriate color coding
 * 
 * @param {Object} props - Component props
 * @param {string} props.grade - The grade to display (A, B, C, D, E, S, F)
 * @param {string} props.educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @param {Object} props.chipProps - Additional props for the Chip component
 */
const GradeChip = ({ grade, educationLevel = 'A_LEVEL', chipProps = {} }) => {
  // Get color based on grade and education level
  const getColor = () => {
    if (educationLevel === 'A_LEVEL') {
      switch (grade) {
        case 'A': return 'success';
        case 'B': return 'primary';
        case 'C': return 'info';
        case 'D': return 'warning';
        case 'E': return 'secondary';
        case 'S': return 'default';
        case 'F': return 'error';
        default: return 'default';
      }
    } else {
      // O_LEVEL grading
      switch (grade) {
        case 'A': return 'success';
        case 'B': return 'primary';
        case 'C': return 'info';
        case 'D': return 'warning';
        case 'F': return 'error';
        default: return 'default';
      }
    }
  };

  return (
    <Chip
      label={grade || '-'}
      color={getColor()}
      size="small"
      {...chipProps}
    />
  );
};

GradeChip.propTypes = {
  grade: PropTypes.string.isRequired,
  educationLevel: PropTypes.oneOf(['O_LEVEL', 'A_LEVEL']),
  chipProps: PropTypes.object
};

export default GradeChip;
