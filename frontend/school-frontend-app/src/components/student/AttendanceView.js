import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const AttendanceView = () => {
  const [attendance, setAttendance] = useState([]);

  // Temporary mock data - replace with actual API call
  useEffect(() => {
    const mockAttendance = [
      { date: '2024-03-01', status: 'Present', subject: 'Mathematics' },
      { date: '2024-03-02', status: 'Present', subject: 'Physics' },
      { date: '2024-03-03', status: 'Absent', subject: 'English' },
      { date: '2024-03-04', status: 'Present', subject: 'Chemistry' },
    ];
    setAttendance(mockAttendance);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>My Attendance</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.subject}</TableCell>
                <TableCell sx={{ 
                  color: record.status === 'Present' ? 'green' : 'red' 
                }}>
                  {record.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AttendanceView;