import React from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';

const ErrorDisplay = ({ error, onRetry }) => {
  // Extract error message
  const errorMessage = error?.message || 'An unknown error occurred';
  
  // Extract error details
  const errorDetails = error?.response?.data?.message || error?.response?.statusText || '';
  
  return (
    <Box padding={3}>
      <Alert 
        severity="error" 
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <Typography variant="subtitle1" gutterBottom>
          {errorMessage}
        </Typography>
        {errorDetails && (
          <Typography variant="body2">
            {errorDetails}
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default ErrorDisplay;
