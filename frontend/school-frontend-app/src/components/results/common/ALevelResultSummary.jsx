import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { formatALevelDivision } from '../../../utils/resultDataStructures';

/**
 * A-Level Result Summary Component
 * 
 * A reusable component for displaying A-Level result summary in a consistent format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.summary - Result summary object
 * @param {boolean} props.showGradeDistribution - Whether to show grade distribution
 * @param {string} props.title - Optional summary title
 */
const ALevelResultSummary = ({
  summary = {},
  showGradeDistribution = true,
  title = 'Result Summary'
}) => {
  // Extract summary data with defaults
  const {
    totalMarks = 0,
    averageMarks = 0,
    totalPoints = 0,
    bestThreePoints = 0,
    division = '0',
    rank = '-',
    totalStudents = 0,
    gradeDistribution = {}
  } = summary;

  // Format division consistently
  const formattedDivision = formatALevelDivision(division);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>

      <Grid container spacing={2} sx={{ px: 2, pb: 2 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Average Marks
            </Typography>
            <Typography variant="h5">
              {typeof averageMarks === 'number' 
                ? averageMarks.toFixed(2) 
                : String(averageMarks)}%
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Best Three Points
            </Typography>
            <Typography variant="h5">
              {bestThreePoints}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Division
            </Typography>
            <Typography variant="h5">
              <Chip
                label={formattedDivision}
                color={
                  division === 'I' || division === '1' ? 'success' :
                  division === 'II' || division === '2' ? 'primary' :
                  division === 'III' || division === '3' ? 'info' :
                  division === 'IV' || division === '4' ? 'warning' : 'error'
                }
              />
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Rank
            </Typography>
            <Typography variant="h5">
              {rank} {totalStudents > 0 ? `out of ${totalStudents}` : ''}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {showGradeDistribution && Object.keys(gradeDistribution || {}).length > 0 && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Grade Distribution
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Grade</TableCell>
                  <TableCell align="center">Count</TableCell>
                  <TableCell align="center">Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(gradeDistribution).map(([grade, count]) => {
                  const totalSubjects = Object.values(gradeDistribution).reduce((sum, c) => sum + c, 0);
                  const percentage = totalSubjects > 0 ? (count / totalSubjects) * 100 : 0;
                  
                  return (
                    <TableRow key={grade}>
                      <TableCell>
                        <Chip
                          label={grade}
                          color={
                            grade === 'A' ? 'success' :
                            grade === 'B' ? 'primary' :
                            grade === 'C' ? 'info' :
                            grade === 'D' ? 'warning' :
                            grade === 'E' ? 'secondary' :
                            grade === 'S' ? 'default' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{count}</TableCell>
                      <TableCell align="center">{percentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

ALevelResultSummary.propTypes = {
  summary: PropTypes.shape({
    totalMarks: PropTypes.number,
    averageMarks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalPoints: PropTypes.number,
    bestThreePoints: PropTypes.number,
    division: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rank: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalStudents: PropTypes.number,
    gradeDistribution: PropTypes.object
  }),
  showGradeDistribution: PropTypes.bool,
  title: PropTypes.string
};

export default ALevelResultSummary;
