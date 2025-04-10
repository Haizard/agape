import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Typography,
  Alert
} from '@mui/material';

/**
 * MarksTable Component
 * 
 * Displays a table of students with editable mark fields
 */
const MarksTable = ({
  students,
  marks,
  handleMarkChange
}) => {
  // Get mark for a student
  const getStudentMark = (studentId) => {
    const mark = marks.find(m => m.studentId === studentId);
    return mark ? mark.mark : '';
  };
  
  // Get grade for a student
  const getStudentGrade = (studentId) => {
    const mark = marks.find(m => m.studentId === studentId);
    return mark ? mark.grade : '';
  };
  
  // Handle input change
  const handleInputChange = (studentId, e) => {
    const value = e.target.value;
    
    // Validate input (only numbers between 0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      handleMarkChange(studentId, value === '' ? '' : Number(value));
    }
  };
  
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      {students.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>
          No students found in this class
        </Alert>
      ) : (
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Reg No</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell align="center">Mark (0-100)</TableCell>
              <TableCell align="center">Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.registrationNumber}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    value={getStudentMark(student._id)}
                    onChange={(e) => handleInputChange(student._id, e)}
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      style: { textAlign: 'center' }
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: getStudentGrade(student._id) === 'F' ? 'error.main' : 
                             (getStudentGrade(student._id) === 'A' || getStudentGrade(student._id) === 'A+') ? 'success.main' : 
                             'text.primary'
                    }}
                  >
                    {getStudentGrade(student._id)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};

export default MarksTable;
