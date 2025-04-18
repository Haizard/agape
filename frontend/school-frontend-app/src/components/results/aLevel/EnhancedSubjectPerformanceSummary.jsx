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
import './ALevelClassReportStyles.css';

/**
 * EnhancedSubjectPerformanceSummary Component
 * 
 * Displays an enhanced subject performance summary for the A-Level class report.
 */
const EnhancedSubjectPerformanceSummary = ({ classReport }) => {
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
    
    // Calculate pass rate and GPA for each subject
    Object.keys(stats).forEach(subject => {
      const subjectData = stats[subject];
      const passGrades = ['A', 'B', 'C', 'D', 'E', 'S'];
      const passed = passGrades.reduce((sum, grade) => sum + (subjectData.grades[grade] || 0), 0);
      
      subjectData.passRate = subjectData.totalStudents > 0 
        ? (passed / subjectData.totalStudents) * 100 
        : 0;
        
      subjectData.gpa = subjectData.totalStudents > 0 
        ? subjectData.totalPoints / subjectData.totalStudents 
        : 0;
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

  // Get CSS class for grade cell
  const getGradeCellClass = (count, total) => {
    if (!total) return '';
    const percentage = (count / total) * 100;
    
    if (percentage >= 70) return 'grade-a';
    if (percentage >= 50) return 'grade-b';
    if (percentage >= 30) return 'grade-c';
    if (percentage > 0) return 'grade-d';
    return '';
  };

  return (
    <Paper className="report-section" sx={{ mb: 3 }}>
      <Box className="section-header">
        <Typography variant="h6" className="section-title" gutterBottom>
          Subject Performance Summary
        </Typography>
      </Box>
      <TableContainer>
        <Table className="summary-table">
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}><strong>Subject</strong></TableCell>
              <TableCell align="center" rowSpan={2}><strong>Reg</strong></TableCell>
              <TableCell align="center" colSpan={7}><strong>Grade Distribution</strong></TableCell>
              <TableCell align="center" rowSpan={2}><strong>Pass %</strong></TableCell>
              <TableCell align="center" rowSpan={2}><strong>GPA</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" className="grade-a"><strong>A</strong></TableCell>
              <TableCell align="center" className="grade-b"><strong>B</strong></TableCell>
              <TableCell align="center" className="grade-c"><strong>C</strong></TableCell>
              <TableCell align="center" className="grade-d"><strong>D</strong></TableCell>
              <TableCell align="center" className="grade-e"><strong>E</strong></TableCell>
              <TableCell align="center" className="grade-s"><strong>S</strong></TableCell>
              <TableCell align="center" className="grade-f"><strong>F</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjectStatsArray.map((subjectData) => (
              <TableRow key={subjectData.subject}>
                <TableCell><strong>{subjectData.subject}</strong></TableCell>
                <TableCell align="center">{subjectData.registered}</TableCell>
                <TableCell 
                  align="center" 
                  className={getGradeCellClass(subjectData.grades['A'], subjectData.totalStudents)}
                >
                  {subjectData.grades['A'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['B'], subjectData.totalStudents)}
                >
                  {subjectData.grades['B'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['C'], subjectData.totalStudents)}
                >
                  {subjectData.grades['C'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['D'], subjectData.totalStudents)}
                >
                  {subjectData.grades['D'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['E'], subjectData.totalStudents)}
                >
                  {subjectData.grades['E'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['S'], subjectData.totalStudents)}
                >
                  {subjectData.grades['S'] || 0}
                </TableCell>
                <TableCell 
                  align="center"
                  className={getGradeCellClass(subjectData.grades['F'], subjectData.totalStudents)}
                >
                  {subjectData.grades['F'] || 0}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(subjectData.passRate)}%
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  {formatNumber(subjectData.gpa)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

EnhancedSubjectPerformanceSummary.propTypes = {
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

export default EnhancedSubjectPerformanceSummary;
