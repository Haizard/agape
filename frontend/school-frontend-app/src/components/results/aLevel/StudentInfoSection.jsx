import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Divider
} from '@mui/material';

/**
 * StudentInfoSection Component
 * 
 * Displays student and exam information in the A-Level result report.
 */
const StudentInfoSection = ({ studentDetails, examInfo }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Student Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Name:</strong> {studentDetails?.name || 'N/A'}
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
                <strong>Rank:</strong> {studentDetails?.rank || 'N/A'} of {studentDetails?.totalStudents || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Form:</strong> {studentDetails?.form || 'N/A'}
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

StudentInfoSection.propTypes = {
  studentDetails: PropTypes.shape({
    name: PropTypes.string,
    rollNumber: PropTypes.string,
    class: PropTypes.string,
    gender: PropTypes.string,
    rank: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalStudents: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    form: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }),
  examInfo: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    term: PropTypes.string,
    academicYear: PropTypes.string
  })
};

export default StudentInfoSection;
