import React from 'react';
import PropTypes from 'prop-types';
import { renderStudent } from '../../utils/safeRender';

/**
 * A component that safely renders a student object
 * 
 * @param {Object} props - Component props
 * @param {Object} props.student - The student object to render
 * @param {string} props.fallback - Fallback text if student is null/undefined
 * @returns {React.ReactElement} - The rendered component
 */
const StudentDisplay = ({ student, fallback = 'No student' }) => {
  if (student === null || student === undefined) {
    return fallback;
  }
  
  return renderStudent(student);
};

StudentDisplay.propTypes = {
  student: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  fallback: PropTypes.string
};

export default StudentDisplay;
