import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Typography } from '@mui/material';
import ALevelSampleReport from './ALevelSampleReport';

/**
 * Container component for the A-Level Sample Report
 * This component doesn't make any API calls and always displays sample data
 */
const ALevelSampleReportContainer = () => {
  const navigate = useNavigate();

  // Handle back button click
  const handleBack = () => {
    navigate('/admin/result-reports');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Button variant="outlined" onClick={handleBack}>
            Back to Reports
          </Button>
        </Grid>
        <Grid item xs>
          <Typography variant="h4" gutterBottom>
            A-Level Sample Report
          </Typography>
        </Grid>
      </Grid>

      <ALevelSampleReport />
    </Box>
  );
};

export default ALevelSampleReportContainer;
