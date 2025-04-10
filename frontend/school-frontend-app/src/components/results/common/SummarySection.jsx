import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Paper,
  Divider,
  Grid,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';

/**
 * Summary Section Component
 * Displays performance summary and grade distribution
 */
const SummarySection = ({ summary, gradeDistribution }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Total Marks:</strong> {summary?.totalMarks || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Average Marks:</strong> {summary?.averageMarks || '0.00'}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Total Points:</strong> {summary?.totalPoints || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Best 3 Principal Points:</strong> {summary?.bestThreePoints || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Division:</strong> {summary?.division || 'N/A'}
                {summary?.division && (
                  <Chip
                    label={`Division ${summary.division}`}
                    color={
                      summary.division === 'I' ? 'success' :
                      summary.division === 'II' ? 'primary' :
                      summary.division === 'III' ? 'info' :
                      summary.division === 'IV' ? 'warning' :
                      summary.division === 'V' ? 'warning' : 'error'
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Rank:</strong> {summary?.rank || 'N/A'} of {summary?.totalStudents || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Grade Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center"><strong>A</strong></TableCell>
                  <TableCell align="center"><strong>B</strong></TableCell>
                  <TableCell align="center"><strong>C</strong></TableCell>
                  <TableCell align="center"><strong>D</strong></TableCell>
                  <TableCell align="center"><strong>E</strong></TableCell>
                  <TableCell align="center"><strong>S</strong></TableCell>
                  <TableCell align="center"><strong>F</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="center">{gradeDistribution.A || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.B || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.C || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.D || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.E || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.S || 0}</TableCell>
                  <TableCell align="center">{gradeDistribution.F || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

SummarySection.propTypes = {
  summary: PropTypes.object.isRequired,
  gradeDistribution: PropTypes.object.isRequired
};

export default SummarySection;
