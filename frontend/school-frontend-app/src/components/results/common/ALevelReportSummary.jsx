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
 * A-Level Report Summary Component
 * Displays a compact summary of A-Level results with subject grades and points
 */
const ALevelReportSummary = ({ studentDetails, subjectResults, summary }) => {
  // Separate principal and subsidiary subjects
  const principalSubjects = subjectResults.filter(result => result.isPrincipal);
  const subsidiarySubjects = subjectResults.filter(result => !result.isPrincipal);

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          A-Level Result Summary
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
                <TableCell><strong>Type</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Principal Subjects */}
              {principalSubjects.map((result) => (
                <TableRow key={`principal-${result.subject}`}>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell align="center">
                    {result.marksObtained !== undefined && result.marksObtained !== null ?
                      Number(result.marksObtained).toFixed(1) :
                      result.marks !== undefined && result.marks !== null ?
                      Number(result.marks).toFixed(1) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.grade || 'N/A'}
                      color={
                        result.grade === 'A' ? 'success' :
                        result.grade === 'B' ? 'success' :
                        result.grade === 'C' ? 'primary' :
                        result.grade === 'D' ? 'warning' :
                        result.grade === 'E' ? 'warning' :
                        result.grade === 'S' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{result.points !== undefined ? result.points : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label="Principal"
                      color="primary"
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                </TableRow>
              ))}

              {/* Subsidiary Subjects */}
              {subsidiarySubjects.map((result) => (
                <TableRow key={`subsidiary-${result.subject}`}>
                  <TableCell>{result.subject}</TableCell>
                  <TableCell align="center">
                    {result.marksObtained !== undefined && result.marksObtained !== null ?
                      Number(result.marksObtained).toFixed(1) :
                      result.marks !== undefined && result.marks !== null ?
                      Number(result.marks).toFixed(1) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={result.grade || 'N/A'}
                      color={
                        result.grade === 'A' ? 'success' :
                        result.grade === 'B' ? 'success' :
                        result.grade === 'C' ? 'primary' :
                        result.grade === 'D' ? 'warning' :
                        result.grade === 'E' ? 'warning' :
                        result.grade === 'S' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{result.points !== undefined ? result.points : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label="Subsidiary"
                      color="default"
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
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
                <strong>Best 3 Points:</strong> {summary?.bestThreePoints || 0}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2">
                <strong>Division:</strong> {summary?.division ?
                  (summary.division.startsWith('Division') ? summary.division : `Division ${summary.division}`)
                  : 'N/A'}
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

ALevelReportSummary.propTypes = {
  studentDetails: PropTypes.object.isRequired,
  subjectResults: PropTypes.array.isRequired,
  summary: PropTypes.object.isRequired
};

export default ALevelReportSummary;
