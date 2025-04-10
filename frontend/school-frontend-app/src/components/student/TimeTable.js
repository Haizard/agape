import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import SafeDisplay from '../common/SafeDisplay';

const TimeTable = () => {
  const timeSlots = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 1:00'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Temporary mock data - replace with actual data from API
  const schedule = {
    'Monday': ['Mathematics', 'Physics', 'Break', 'English', 'Chemistry'],
    'Tuesday': ['Physics', 'Chemistry', 'Break', 'Mathematics', 'English'],
    'Wednesday': ['English', 'Mathematics', 'Break', 'Chemistry', 'Physics'],
    'Thursday': ['Chemistry', 'English', 'Break', 'Physics', 'Mathematics'],
    'Friday': ['Physics', 'Mathematics', 'Break', 'English', 'Chemistry']
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Class Time Table</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {days.map((day) => (
                <TableCell key={day}>{day}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {timeSlots.map((time, index) => (
              <TableRow key={time}>
                <TableCell>{time}</TableCell>
                {days.map((day) => (
                  <TableCell key={`${day}-${time}`}>
                    <SafeDisplay value={schedule[day][index]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TimeTable;