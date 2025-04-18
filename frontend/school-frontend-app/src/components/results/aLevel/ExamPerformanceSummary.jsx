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

/**
 * ExamPerformanceSummary Component
 * 
 * Displays the examination performance summary for the A-Level class report.
 */
const ExamPerformanceSummary = ({ classReport }) => {
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
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Examination Performance Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center"><strong>Registered</strong></TableCell>
              <TableCell align="center"><strong>Absent</strong></TableCell>
              <TableCell align="center"><strong>Sat</strong></TableCell>
              <TableCell align="center"><strong>Div I</strong></TableCell>
              <TableCell align="center"><strong>Div II</strong></TableCell>
              <TableCell align="center"><strong>Div III</strong></TableCell>
              <TableCell align="center"><strong>Div IV</strong></TableCell>
              <TableCell align="center"><strong>Div 0</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">{attendanceStats.registered}</TableCell>
              <TableCell align="center">{attendanceStats.absent}</TableCell>
              <TableCell align="center">{attendanceStats.sat}</TableCell>
              <TableCell align="center">{divisionDistribution['I'] || 0}</TableCell>
              <TableCell align="center">{divisionDistribution['II'] || 0}</TableCell>
              <TableCell align="center">{divisionDistribution['III'] || 0}</TableCell>
              <TableCell align="center">{divisionDistribution['IV'] || 0}</TableCell>
              <TableCell align="center">{divisionDistribution['0'] || 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

ExamPerformanceSummary.propTypes = {
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

export default ExamPerformanceSummary;
