import React, { useState } from 'react';
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
  Checkbox,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const AttendanceManagement = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Dummy data - replace with actual API calls
  const classes = ['Class A', 'Class B', 'Class C'];
  const students = [
    { id: 1, name: 'John Doe', present: true },
    { id: 2, name: 'Jane Smith', present: false },
    // Add more students
  ];

  const handleAttendanceChange = (studentId) => {
    // Implement attendance change logic
  };

  const handleSubmit = () => {
    // Implement submit logic
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Attendance Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            label="Select Class"
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>{cls}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ height: '56px', padding: '0 15px' }}
          />
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell align="center">Present</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={student.present}
                    onChange={() => handleAttendanceChange(student.id)}
                  />
                </TableCell>
                <TableCell>
                  {/* Add notes field if needed */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Save Attendance
        </Button>
      </Box>
    </Box>
  );
};

export default AttendanceManagement;