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
  Divider
} from '@mui/material';
import { formatNumber } from '../../../utils/reportFormatUtils';
// Import the utility functions for examination GPA and class pass rate calculation
import { calculateExaminationGPA, calculateClassPassRate } from '../../../utils/aLevelCalculationUtils';

/**
 * OverallPerformanceSection Component
 *
 * Displays the overall performance summary for the A-Level class report.
 */
const OverallPerformanceSection = ({ classReport }) => {
  // Calculate the number of passed candidates using the formula
  // Class Pass Rate = Number of students with divisions I, II, III, or IV / Total students × 100%
  const passRate = calculateClassPassRate(classReport.students || []);
  const passedCandidates = Math.round((passRate / 100) * (classReport.students?.length || 0));

  // Calculate examination GPA using the formula
  // Method 1 (Student-based): Sum of all students' best three points / Total number of students
  const examGPA = calculateExaminationGPA(classReport.students || []);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Overall Performance
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Metric</strong></TableCell>
              <TableCell align="center"><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Total Candidates</TableCell>
              <TableCell align="center">{classReport.totalStudents || classReport.students?.length || 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Passed Candidates</TableCell>
              <TableCell align="center">{passedCandidates}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pass Rate</TableCell>
              <TableCell align="center">{formatNumber(passRate)}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Examination GPA</TableCell>
              <TableCell align="center">{formatNumber(examGPA)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Class Average</TableCell>
              <TableCell align="center">{formatNumber(classReport.classAverage)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

OverallPerformanceSection.propTypes = {
  classReport: PropTypes.shape({
    totalStudents: PropTypes.number,
    classAverage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    students: PropTypes.arrayOf(
      PropTypes.shape({
        bestThreePoints: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        division: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      })
    )
  }).isRequired
};

export default OverallPerformanceSection;
