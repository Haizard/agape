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
import './ALevelClassReportStyles.css';

/**
 * EnhancedOverallPerformanceSection Component
 * 
 * Displays an enhanced overall performance summary for the A-Level class report.
 */
const EnhancedOverallPerformanceSection = ({ classReport }) => {
  // Calculate the number of passed candidates (students with division I, II, III, or IV)
  const passedCandidates = (classReport.students || []).filter(
    student => student.division && ['I', 'II', 'III', 'IV'].includes(student.division.toString().replace('Division ', ''))
  ).length;

  // Calculate examination GPA (average of all students' best three points)
  const examGPA = (classReport.students || []).reduce(
    (sum, student) => sum + (student.bestThreePoints || 0), 
    0
  ) / (classReport.students?.length || 1);

  // Calculate pass percentage
  const passPercentage = classReport.students?.length 
    ? (passedCandidates / classReport.students.length) * 100 
    : 0;

  return (
    <Paper className="report-section" sx={{ mb: 3 }}>
      <Box className="section-header">
        <Typography variant="h6" className="section-title" gutterBottom>
          Overall Performance
        </Typography>
      </Box>
      <TableContainer>
        <Table className="summary-table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Metric</strong></TableCell>
              <TableCell align="center"><strong>Value</strong></TableCell>
              <TableCell><strong>Metric</strong></TableCell>
              <TableCell align="center"><strong>Value</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Total Candidates</TableCell>
              <TableCell align="center">{classReport.totalStudents || classReport.students?.length || 0}</TableCell>
              <TableCell>Passed Candidates</TableCell>
              <TableCell align="center">{passedCandidates} ({formatNumber(passPercentage)}%)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Examination GPA</TableCell>
              <TableCell align="center">{formatNumber(examGPA)}</TableCell>
              <TableCell>Class Average</TableCell>
              <TableCell align="center">{formatNumber(classReport.classAverage)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

EnhancedOverallPerformanceSection.propTypes = {
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

export default EnhancedOverallPerformanceSection;
