import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';

/**
 * Approvals Section Component
 * Displays the approvals section with signature fields
 */
const ApprovalsSection = () => {
  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        APPROVED BY
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">ACADEMIC TEACHER NAME: _______________________</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">SIGN: _______________________</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">HEAD OF SCHOOL NAME: _______________________</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">SIGN: _______________________</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ApprovalsSection;
