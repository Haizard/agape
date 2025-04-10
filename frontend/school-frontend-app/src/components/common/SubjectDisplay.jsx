import React from 'react';
import PropTypes from 'prop-types';
import { renderSubject } from '../../utils/safeRender';

/**
 * A component that safely renders a subject object
 * 
 * @param {Object} props - Component props
 * @param {Object} props.subject - The subject object to render
 * @param {string} props.fallback - Fallback text if subject is null/undefined
 * @returns {React.ReactElement} - The rendered component
 */
const SubjectDisplay = ({ subject, fallback = 'No subject' }) => {
  if (subject === null || subject === undefined) {
    return fallback;
  }
  
  return renderSubject(subject);
};

SubjectDisplay.propTypes = {
  subject: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  fallback: PropTypes.string
};

export default SubjectDisplay;
