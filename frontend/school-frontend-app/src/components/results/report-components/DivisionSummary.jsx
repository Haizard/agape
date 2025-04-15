import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paper } from '@mui/material';

/**
 * Division Summary Component
 * Displays a summary of student divisions
 */
const DivisionSummary = ({ divisionSummary }) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
      <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
        DIV-I: {divisionSummary?.I || 0} |
        DIV-II: {divisionSummary?.II || 0} |
        DIV-III: {divisionSummary?.III || 0} |
        DIV-IV: {divisionSummary?.IV || 0} |
        DIV-0: {divisionSummary?.['0'] || 0}
      </Typography>
    </Paper>
  );
};

DivisionSummary.propTypes = {
  divisionSummary: PropTypes.shape({
    I: PropTypes.number,
    II: PropTypes.number,
    III: PropTypes.number,
    IV: PropTypes.number,
    0: PropTypes.number
  })
};

DivisionSummary.defaultProps = {
  divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 }
};

export default DivisionSummary;
