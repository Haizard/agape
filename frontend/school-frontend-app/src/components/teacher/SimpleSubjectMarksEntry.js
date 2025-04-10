import React from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';

const SimpleSubjectMarksEntry = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Enter Subject Marks</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1">
          This is a simplified version of the Subject Marks Entry component.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          The full component is currently being fixed. Please check back later.
        </Alert>
      </Paper>
    </Box>
  );
};

export default SimpleSubjectMarksEntry;
