import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Grid,
  Chip
} from '@mui/material';

/**
 * O-Level Report Summary Component
 * Displays a compact summary of O-Level results with subject grades and points
 */
const OLevelReportSummary = ({ studentDetails, subjectResults, summary }) => {
  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          O-Level Result Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Name:</strong> {studentDetails?.name || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {studentDetails?.class || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Form:</strong> {studentDetails?.form || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Exam:</strong> {summary?.examName || 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                <TableCell><strong>Subject</strong></TableCell>
                <TableCell align="center"><strong>Marks</strong></TableCell>
                <TableCell align="center"><strong>Grade</strong></TableCell>
                <TableCell align="center"><strong>Points</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjectResults.map((result) => (
                <TableRow key={result.subject}>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell align="center">{result.marksObtained || result.marks || 0}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.grade || 'N/A'}
                      color={
                        result.grade === 'A' ? 'success' :
                        result.grade === 'B' ? 'primary' :
                        result.grade === 'C' ? 'primary' :
                        result.grade === 'D' ? 'warning' :
                        result.grade === 'F' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{result.points || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">
                <strong>Average:</strong> {summary?.averageMarks || '0.00'}%
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">
                <strong>Total Points:</strong> {summary?.totalPoints || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">
                <strong>Division:</strong> {summary?.division || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">
                <strong>Rank:</strong> {summary?.rank || 'N/A'}/{summary?.totalStudents || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  );
};

OLevelReportSummary.propTypes = {
  studentDetails: PropTypes.object.isRequired,
  subjectResults: PropTypes.array.isRequired,
  summary: PropTypes.object.isRequired
};

export default OLevelReportSummary;
