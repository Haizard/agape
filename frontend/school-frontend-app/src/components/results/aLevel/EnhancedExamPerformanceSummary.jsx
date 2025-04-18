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
import './ALevelClassReportStyles.css';

/**
 * EnhancedExamPerformanceSummary Component
 * 
 * Displays an enhanced examination performance summary for the A-Level class report.
 */
const EnhancedExamPerformanceSummary = ({ classReport }) => {
  // Calculate division distribution
  const divisionDistribution = useMemo(() => {
    // Use the provided division distribution if available
    if (classReport.divisionDistribution) {
      return classReport.divisionDistribution;
    }

    // Otherwise, calculate it from the students array
    const distribution = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
    
    (classReport.students || []).forEach(student => {
      if (student.division) {
        const divKey = student.division.toString().replace('Division ', '');
        distribution[divKey] = (distribution[divKey] || 0) + 1;
      }
    });
    
    return distribution;
  }, [classReport]);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    const totalRegistered = classReport.totalStudents || classReport.students?.length || 0;
    const totalAbsent = classReport.absentStudents || 0;
    const totalSat = totalRegistered - totalAbsent;
    
    return {
      registered: totalRegistered,
      absent: totalAbsent,
      sat: totalSat
    };
  }, [classReport]);

  return (
    <Paper className="report-section" sx={{ mb: 3 }}>
      <Box className="section-header">
        <Typography variant="h6" className="section-title" gutterBottom>
          Examination Performance Summary
        </Typography>
      </Box>
      <TableContainer>
        <Table className="summary-table">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ bgcolor: '#1a237e', color: 'white' }}><strong>Registered</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#1a237e', color: 'white' }}><strong>Absent</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#1a237e', color: 'white' }}><strong>Sat</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#4caf50', color: 'white' }}><strong>Div I</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#2196f3', color: 'white' }}><strong>Div II</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#ff9800', color: 'white' }}><strong>Div III</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#ff5722', color: 'white' }}><strong>Div IV</strong></TableCell>
              <TableCell align="center" sx={{ bgcolor: '#f44336', color: 'white' }}><strong>Div 0</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{attendanceStats.registered}</TableCell>
              <TableCell align="center">{attendanceStats.absent}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{attendanceStats.sat}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4caf50' }}>{divisionDistribution['I'] || 0}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2196f3' }}>{divisionDistribution['II'] || 0}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ff9800' }}>{divisionDistribution['III'] || 0}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ff5722' }}>{divisionDistribution['IV'] || 0}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#f44336' }}>{divisionDistribution['0'] || 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

EnhancedExamPerformanceSummary.propTypes = {
  classReport: PropTypes.shape({
    totalStudents: PropTypes.number,
    absentStudents: PropTypes.number,
    divisionDistribution: PropTypes.object,
    students: PropTypes.arrayOf(
      PropTypes.shape({
        division: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      })
    )
  }).isRequired
};

export default EnhancedExamPerformanceSummary;
