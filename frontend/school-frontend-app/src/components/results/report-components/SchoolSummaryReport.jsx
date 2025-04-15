import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Grid } from '@mui/material';

/**
 * School Summary Report Component
 * Displays overall performance metrics
 */
const SchoolSummaryReport = ({ overallPerformance }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        Overall Performance
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="body1">
            Total Passed Candidates: {overallPerformance?.totalPassed || 0}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body1">
            Examination GPA: {overallPerformance?.examGpa || 'N/A'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

SchoolSummaryReport.propTypes = {
  overallPerformance: PropTypes.shape({
    totalPassed: PropTypes.number,
    examGpa: PropTypes.string
  })
};

SchoolSummaryReport.defaultProps = {
  overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
};

export default SchoolSummaryReport;
