import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      padding={3}
    >
      <CircularProgress size={40} thickness={4} />
      <Typography variant="body1" style={{ marginTop: 16 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingIndicator;
