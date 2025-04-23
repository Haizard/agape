import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  formatNumber,
  formatDivision,
  getDivisionColor,
  formatRank,
  getRankColor
} from '../../../utils/reportFormatUtils';

/**
 * ReportSummary Component
 *
 * Displays the performance summary and grade distribution in the A-Level result report.
 */
const ReportSummary = ({ summary }) => {
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
                <strong>Average Marks:</strong> {formatNumber(summary?.averageMarks)}%
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
                <strong>Division:</strong>
                {summary?.missingPrincipalSubjects > 0 ? (
                  <Tooltip title={`Cannot calculate division: Need ${summary.missingPrincipalSubjects} more principal subject(s)`}>
                    <span>
                      N/A <InfoIcon color="warning" fontSize="small" sx={{ verticalAlign: 'middle', ml: 0.5 }} />
                    </span>
                  </Tooltip>
                ) : (
                  <>
                    {formatDivision(summary?.division)}
                    {summary?.division && (
                      <Chip
                        label={formatDivision(summary.division)}
                        color={getDivisionColor(summary.division)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </>
                )}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Rank:</strong> {formatRank(summary?.rank, summary?.totalStudents)}
                {summary?.rank && summary?.totalStudents && (
                  <Chip
                    label={formatRank(summary.rank, summary.totalStudents)}
                    color={getRankColor(summary.rank)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
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
                  <TableCell align="center">{summary?.gradeDistribution?.A || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.B || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.C || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.D || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.E || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.S || 0}</TableCell>
                  <TableCell align="center">{summary?.gradeDistribution?.F || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

ReportSummary.propTypes = {
  summary: PropTypes.shape({
    totalMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    averageMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    bestThreePoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    division: PropTypes.string,
    rank: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalStudents: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    missingPrincipalSubjects: PropTypes.number,
    gradeDistribution: PropTypes.shape({
      A: PropTypes.number,
      B: PropTypes.number,
      C: PropTypes.number,
      D: PropTypes.number,
      E: PropTypes.number,
      S: PropTypes.number,
      F: PropTypes.number
    })
  })
};

export default ReportSummary;
