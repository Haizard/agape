import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * MarksEntry Component
 * 
 * Standard marks entry component
 */
const MarksEntry = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Marks Entry
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        We recommend using the Offline Marks Entry feature for better performance and offline capability.
      </Alert>
      
      <Button 
        variant="contained" 
        component={RouterLink} 
        to="/marks/offline-entry"
      >
        Switch to Offline Marks Entry
      </Button>
    </Box>
  );
};

export default MarksEntry;
