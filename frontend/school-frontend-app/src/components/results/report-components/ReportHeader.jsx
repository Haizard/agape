import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Paper } from '@mui/material';

/**
 * Report Header Component
 * Displays the school header information for A-Level reports
 */
const ReportHeader = ({ year }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
      <Typography variant="h5" align="center" gutterBottom>
        Evangelical Lutheran Church in Tanzania - Northern Diocese
      </Typography>
      <Typography variant="h4" align="center" gutterBottom>
        Agape Lutheran Junior Seminary
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        PO Box 8882, Moshi, Tanzania
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        Mobile: 0759767735 | Email: infoagapeseminary@gmail.com
      </Typography>
      <Typography variant="h5" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
        {year} FORM FIVE EXAMINATION RESULTS
      </Typography>
    </Paper>
  );
};

ReportHeader.propTypes = {
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

ReportHeader.defaultProps = {
  year: new Date().getFullYear()
};

export default ReportHeader;
