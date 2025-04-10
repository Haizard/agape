import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';

/**
 * NotFound Component
 * 
 * 404 page for when a route is not found
 */
const NotFound = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 64px)' 
    }}>
      <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 500 }}>
        <SadIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          404 - Page Not Found
        </Typography>
        
        <Typography variant="body1" paragraph>
          The page you are looking for does not exist or has been moved.
        </Typography>
        
        <Button 
          variant="contained" 
          component={RouterLink} 
          to="/"
          size="large"
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
