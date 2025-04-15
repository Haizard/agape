import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

/**
 * Subject Performance Summary Component
 * Displays a table of subject-wise performance metrics
 */
const SubjectPerformanceSummary = ({ subjectPerformance }) => {
  const hasSubjectData = Object.keys(subjectPerformance || {}).length > 0;
  
  // Common A-Level subjects for placeholder data
  const commonSubjects = [
    'General Studies', 'Chemistry', 'Physics', 'Biology', 'Geography', 
    'Advanced Mathematics', 'History', 'English Language', 'Economics', 
    'Kiswahili', 'BAM'
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        Subject-Wise Performance Summary
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>SUBJECT NAME</TableCell>
              <TableCell align="center">REG</TableCell>
              <TableCell align="center">A</TableCell>
              <TableCell align="center">B</TableCell>
              <TableCell align="center">C</TableCell>
              <TableCell align="center">D</TableCell>
              <TableCell align="center">E</TableCell>
              <TableCell align="center">S</TableCell>
              <TableCell align="center">F</TableCell>
              <TableCell align="center">PASS</TableCell>
              <TableCell align="center">GPA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hasSubjectData ? (
              Object.values(subjectPerformance).map((subject) => (
                <TableRow key={subject.name}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell align="center">{subject.registered}</TableCell>
                  <TableCell align="center">{subject.grades.A}</TableCell>
                  <TableCell align="center">{subject.grades.B}</TableCell>
                  <TableCell align="center">{subject.grades.C}</TableCell>
                  <TableCell align="center">{subject.grades.D}</TableCell>
                  <TableCell align="center">{subject.grades.E}</TableCell>
                  <TableCell align="center">{subject.grades.S}</TableCell>
                  <TableCell align="center">{subject.grades.F}</TableCell>
                  <TableCell align="center">{subject.passed}</TableCell>
                  <TableCell align="center">{subject.gpa}</TableCell>
                </TableRow>
              ))
            ) : (
              // If no subject performance data, show placeholder rows for common subjects
              commonSubjects.map((subjectName) => (
                <TableRow key={subjectName}>
                  <TableCell>{subjectName}</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">0</TableCell>
                  <TableCell align="center">N/A</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

SubjectPerformanceSummary.propTypes = {
  subjectPerformance: PropTypes.object
};

SubjectPerformanceSummary.defaultProps = {
  subjectPerformance: {}
};

export default SubjectPerformanceSummary;
