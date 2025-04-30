import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Grid } from '@mui/material';
import AssessmentNavigation from './AssessmentNavigation';

const AssessmentManagement = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <AssessmentNavigation />
        </Grid>
        <Grid item xs={12} md={9}>
          <Outlet />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssessmentManagement;