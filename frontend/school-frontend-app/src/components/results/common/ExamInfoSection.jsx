import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Divider,
  Grid
} from '@mui/material';

/**
 * Exam Information Section Component
 * Displays exam details in a formatted section
 */
const ExamInfoSection = ({ examName, examDate, term }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Exam Information
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Exam:</strong> {examName || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Date:</strong> {examDate || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1">
            <strong>Term:</strong> {term || 'Term 1'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

ExamInfoSection.propTypes = {
  examName: PropTypes.string,
  examDate: PropTypes.string,
  term: PropTypes.string
};

export default ExamInfoSection;
