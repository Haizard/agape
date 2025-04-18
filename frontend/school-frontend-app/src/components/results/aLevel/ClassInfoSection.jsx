import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Divider
} from '@mui/material';

/**
 * ClassInfoSection Component
 *
 * Displays class and exam information in the A-Level class result report.
 */
const ClassInfoSection = ({ classDetails, examInfo }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Class Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Class:</strong> {classDetails?.className || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Form:</strong> {classDetails?.formLevel || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Section:</strong> {classDetails?.section || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Stream:</strong> {classDetails?.stream || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Total Students:</strong> {classDetails?.totalStudents || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Class Average:</strong> {typeof classDetails?.classAverage === 'number' ? classDetails.classAverage.toFixed(2) : classDetails?.classAverage || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Exam Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Exam:</strong> {examInfo?.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Date:</strong> {examInfo?.date || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Term:</strong> {examInfo?.term || 'Term 1'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Academic Year:</strong> {examInfo?.academicYear || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

ClassInfoSection.propTypes = {
  classDetails: PropTypes.shape({
    className: PropTypes.string,
    formLevel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    section: PropTypes.string,
    stream: PropTypes.string,
    totalStudents: PropTypes.number,
    classAverage: PropTypes.number
  }),
  examInfo: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    term: PropTypes.string,
    academicYear: PropTypes.string
  })
};

export default ClassInfoSection;
