import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid
} from '@mui/material';

/**
 * Signatures Section Component
 * Displays signature lines for class teacher, academic master, and headmaster
 */
const SignaturesSection = () => {
  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Signatures
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Box>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                ____________________
              </Typography>
              <Typography variant="body2">
                Class Teacher
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                ____________________
              </Typography>
              <Typography variant="body2">
                Academic Master
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                ____________________
              </Typography>
              <Typography variant="body2">
                Headmaster
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default SignaturesSection;
