import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';

/**
 * Student Details Component
 * Displays student information in a structured format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.studentDetails - Student details
 * @param {Object} props.examDetails - Exam details
 * @param {string} props.title - Optional title
 */
const StudentDetails = ({ 
  studentDetails = {}, 
  examDetails = {},
  title = 'Student Information'
}) => {
  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Name:</strong> {studentDetails.name || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Roll Number:</strong> {studentDetails.rollNumber || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {studentDetails.class || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Form:</strong> {studentDetails.form || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Gender:</strong> {studentDetails.gender || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Exam:</strong> {examDetails.name || 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {examDetails.academicYear && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              <strong>Academic Year:</strong> {examDetails.academicYear}
            </Typography>
          </Box>
        )}

        {examDetails.examDate && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1">
              <strong>Exam Date:</strong> {examDetails.examDate}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

StudentDetails.propTypes = {
  studentDetails: PropTypes.shape({
    name: PropTypes.string,
    rollNumber: PropTypes.string,
    class: PropTypes.string,
    form: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gender: PropTypes.string
  }),
  examDetails: PropTypes.shape({
    name: PropTypes.string,
    academicYear: PropTypes.string,
    examDate: PropTypes.string
  }),
  title: PropTypes.string
};

export default StudentDetails;
