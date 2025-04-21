import React, { useMemo } from 'react';
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
// Import the utility functions for GPA and pass rate calculation
import { calculateSubjectGPA, calculateSubjectPassRate } from '../../../utils/aLevelCalculationUtils';

/**
 * SubjectPerformanceSummary Component
 *
 * Displays the subject performance summary for the A-Level class report.
 */
const SubjectPerformanceSummary = ({ classReport }) => {
  // Calculate subject statistics
  const subjectStats = useMemo(() => {
    const stats = {};
    const students = classReport.students || [];

    // First, identify all subjects
    students.forEach(student => {
      (student.results || []).forEach(result => {
        if (result.subject && !stats[result.subject]) {
          stats[result.subject] = {
            registered: 0,
            grades: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'S': 0, 'F': 0 },
            totalPoints: 0,
            totalStudents: 0
          };
        }
      });
    });

    // Then, calculate statistics for each subject
    students.forEach(student => {
      (student.results || []).forEach(result => {
        if (result.subject) {
          stats[result.subject].registered++;
          stats[result.subject].totalStudents++;

          if (result.grade) {
            stats[result.subject].grades[result.grade] =
              (stats[result.subject].grades[result.grade] || 0) + 1;
          }

          if (result.points !== undefined && result.points !== null) {
            stats[result.subject].totalPoints += Number(result.points);
          }
        }
      });
    });

    // Calculate pass rate and GPA for each subject using the formula
    Object.keys(stats).forEach(subject => {
      const subjectData = stats[subject];

      // Determine if the subject is principal (this would need to be enhanced with actual subject data)
      // For now, we'll assume all subjects are principal for demonstration
      const isPrincipal = true;

      // Calculate pass rate using the formula
      // For principal subjects: Pass Rate = (Count of A + B + C + D + E grades) / Total students × 100%
      // For subsidiary subjects: Pass Rate = (Count of A + B + C + D + E + S grades) / Total students × 100%
      subjectData.passRate = calculateSubjectPassRate(subjectData.grades, subjectData.totalStudents, isPrincipal);

      // Calculate GPA using the formula
      // Subject GPA = Sum(Number of students with each grade × Grade point value) / Total number of students
      subjectData.gpa = calculateSubjectGPA(subjectData.grades, subjectData.totalStudents);
    });

    return stats;
  }, [classReport]);

  // Convert subject stats to array for rendering
  const subjectStatsArray = useMemo(() => {
    return Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      ...data
    }));
  }, [subjectStats]);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Subject Performance Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Subject</strong></TableCell>
              <TableCell align="center"><strong>Reg</strong></TableCell>
              <TableCell align="center"><strong>A</strong></TableCell>
              <TableCell align="center"><strong>B</strong></TableCell>
              <TableCell align="center"><strong>C</strong></TableCell>
              <TableCell align="center"><strong>D</strong></TableCell>
              <TableCell align="center"><strong>E</strong></TableCell>
              <TableCell align="center"><strong>S</strong></TableCell>
              <TableCell align="center"><strong>F</strong></TableCell>
              <TableCell align="center"><strong>Pass %</strong></TableCell>
              <TableCell align="center"><strong>GPA</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjectStatsArray.map((subjectData) => (
              <TableRow key={subjectData.subject}>
                <TableCell>{subjectData.subject}</TableCell>
                <TableCell align="center">{subjectData.registered}</TableCell>
                <TableCell align="center">{subjectData.grades['A'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['B'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['C'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['D'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['E'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['S'] || 0}</TableCell>
                <TableCell align="center">{subjectData.grades['F'] || 0}</TableCell>
                <TableCell align="center">{formatNumber(subjectData.passRate)}%</TableCell>
                <TableCell align="center">{formatNumber(subjectData.gpa)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

SubjectPerformanceSummary.propTypes = {
  classReport: PropTypes.shape({
    students: PropTypes.arrayOf(
      PropTypes.shape({
        results: PropTypes.arrayOf(
          PropTypes.shape({
            subject: PropTypes.string,
            grade: PropTypes.string,
            points: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
          })
        )
      })
    )
  }).isRequired
};

export default SubjectPerformanceSummary;
