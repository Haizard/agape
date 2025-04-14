import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import DivisionChip from './DivisionChip';

/**
 * Report Summary Component
 * Displays a summary of student performance
 * 
 * @param {Object} props - Component props
 * @param {Object} props.summary - Summary data
 * @param {string} props.educationLevel - The education level (O_LEVEL or A_LEVEL)
 * @param {string} props.title - Optional title
 */
const ReportSummary = ({ 
  summary = {}, 
  educationLevel = 'A_LEVEL',
  title = 'Result Summary'
}) => {
  // Determine which points to display based on education level
  const getPointsLabel = () => {
    if (educationLevel === 'A_LEVEL') {
      return 'Best 3 Points';
    } else {
      return 'Best 7 Points';
    }
  };

  // Determine which points value to display based on education level
  const getPointsValue = () => {
    if (educationLevel === 'A_LEVEL') {
      return summary.bestThreePoints || 0;
    } else {
      return summary.bestSevenPoints || 0;
    }
  };

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
          <Grid item xs={6} md={3}>
            <Typography variant="body2">
              <strong>Average:</strong> {summary.averageMarks || '0.00'}%
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2">
              <strong>{getPointsLabel()}:</strong> {getPointsValue()}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2">
              <strong>Division:</strong> {' '}
              <DivisionChip 
                division={summary.division} 
                educationLevel={educationLevel}
                chipProps={{ size: 'small' }}
              />
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2">
              <strong>Rank:</strong> {summary.rank || 'N/A'}/{summary.totalStudents || 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {summary.remarks && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Remarks:</strong> {summary.remarks}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

ReportSummary.propTypes = {
  summary: PropTypes.shape({
    averageMarks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bestThreePoints: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bestSevenPoints: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    division: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rank: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalStudents: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    remarks: PropTypes.string
  }),
  educationLevel: PropTypes.oneOf(['O_LEVEL', 'A_LEVEL']),
  title: PropTypes.string
};

export default ReportSummary;
