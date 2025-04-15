import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';

/**
 * A simplified A-Level class report component that always displays a complete structure
 * even when there's no data.
 */
const SimpleALevelClassReport = ({ data, error }) => {
  // If loading, show loading message
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Loading report data...</Alert>
      </Box>
    );
  }

  // Show error message but continue to display the report structure
  const errorAlert = error ? (
    <Alert severity="error" sx={{ mb: 3 }}>
      {error}
    </Alert>
  ) : null;

  // Default subjects for A-Level
  const defaultSubjects = [
    'General Studies',
    'History',
    'Physics',
    'Chemistry',
    'Kiswahili',
    'Advanced Mathematics',
    'Biology',
    'Geography',
    'English',
    'BAM',
    'Economics'
  ];

  // Use data or create placeholder data
  const reportData = data || {
    className: 'Not Available',
    examName: 'Not Available',
    year: new Date().getFullYear(),
    educationLevel: 'A_LEVEL',
    students: [
      // Add placeholder student to show structure
      {
        id: 'placeholder-1',
        studentName: 'No Data Available',
        sex: '-',
        points: '-',
        division: '-',
        totalMarks: '-',
        averageMarks: '-',
        rank: '-'
      }
    ],
    subjects: defaultSubjects.map(name => ({ name })),
    divisionSummary: { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 },
    overallPerformance: { totalPassed: 0, examGpa: 'N/A' }
  };

  // Check if this is placeholder data
  const isPlaceholder = !data || data.students.length === 0;

  return (
    <Box className="simple-a-level-class-report" sx={{ p: 2 }}>
      {errorAlert}
      
      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h5" align="center" gutterBottom>
          Evangelical Lutheran Church in Tanzania - Northern Diocese
        </Typography>
        <Typography variant="h4" align="center" gutterBottom>
          St. John Vianney Secondary School
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          PO Box 8882, Moshi, Tanzania
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Mobile: 0759767735 | Email: infoagapeseminary@gmail.com
        </Typography>
        <Typography variant="h5" align="center" sx={{ mt: 2 }}>
          A-LEVEL EXAMINATION RESULTS - {reportData.year}
        </Typography>
        <Typography variant="h6" align="center" gutterBottom>
          CLASS: {reportData.className} | EXAM: {reportData.examName}
        </Typography>
      </Paper>

      {/* Student Results Table */}
      <Paper sx={{ p: 3, mb: 3, overflowX: 'auto' }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Student Results
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>NO.</TableCell>
                <TableCell>STUDENT NAME</TableCell>
                <TableCell>SEX</TableCell>
                <TableCell align="center">POINTS</TableCell>
                <TableCell align="center">DIVISION</TableCell>

                {/* Subject Columns */}
                {defaultSubjects.map((subject) => (
                  <TableCell key={subject} align="center">
                    {subject}
                  </TableCell>
                ))}

                {/* Summary Columns */}
                <TableCell align="center">TOTAL</TableCell>
                <TableCell align="center">AVERAGE</TableCell>
                <TableCell align="center">RANK</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.students.map((student, index) => (
                <TableRow 
                  key={student.id || index} 
                  sx={isPlaceholder ? { opacity: 0.7, fontStyle: 'italic' } : {}}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{student.studentName || '-'}</TableCell>
                  <TableCell>{student.sex || '-'}</TableCell>
                  <TableCell align="center">{student.points || '-'}</TableCell>
                  <TableCell align="center">{student.division || '-'}</TableCell>

                  {/* Subject Marks */}
                  {defaultSubjects.map((subject) => (
                    <TableCell key={subject} align="center">-</TableCell>
                  ))}

                  {/* Summary Cells */}
                  <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                  <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                  <TableCell align="center">{student.rank || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Division Summary */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Division Summary
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">REGISTERED</TableCell>
                <TableCell align="center">ABSENT</TableCell>
                <TableCell align="center">SAT</TableCell>
                <TableCell align="center">DIV I</TableCell>
                <TableCell align="center">DIV II</TableCell>
                <TableCell align="center">DIV III</TableCell>
                <TableCell align="center">DIV IV</TableCell>
                <TableCell align="center">DIV 0</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell align="center">{reportData.students.length}</TableCell>
                <TableCell align="center">0</TableCell>
                <TableCell align="center">{reportData.students.length}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.I || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.II || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.III || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.IV || 0}</TableCell>
                <TableCell align="center">{reportData.divisionSummary?.['0'] || 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Subject Performance Summary */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Subject Performance Summary
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
              {defaultSubjects.map((subject) => (
                <TableRow key={subject}>
                  <TableCell>{subject}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approvals Section */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          APPROVED BY
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="subtitle1">ACADEMIC TEACHER NAME: _______________________</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">SIGN: _______________________</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1">HEAD OF SCHOOL NAME: _______________________</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">SIGN: _______________________</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

SimpleALevelClassReport.propTypes = {
  data: PropTypes.object,
  error: PropTypes.string
};

export default SimpleALevelClassReport;
