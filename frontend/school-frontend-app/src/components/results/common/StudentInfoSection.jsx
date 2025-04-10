import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Divider,
  Grid,
  Chip
} from '@mui/material';

/**
 * Student Information Section Component
 * Displays student details in a formatted section
 */
const StudentInfoSection = ({ studentDetails, summary }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Student Information
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Name:</strong> {studentDetails?.name || studentDetails?.fullName || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Roll Number:</strong> {studentDetails?.rollNumber || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Class:</strong> {studentDetails?.class || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Gender:</strong> {studentDetails?.gender || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Rank:</strong> {summary?.rank || studentDetails?.rank || 'N/A'} of {summary?.totalStudents || studentDetails?.totalStudents || 'N/A'}
            {summary?.rank && summary?.totalStudents && (
              <Chip
                label={`${summary.rank}/${summary.totalStudents}`}
                color={summary.rank <= 3 ? 'success' : 'primary'}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

StudentInfoSection.propTypes = {
  studentDetails: PropTypes.object.isRequired,
  summary: PropTypes.object
};

export default StudentInfoSection;
