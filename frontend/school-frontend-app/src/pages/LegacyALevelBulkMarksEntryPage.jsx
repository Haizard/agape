import React from 'react';
import LegacyALevelBulkMarksEntryIntegrated from '../components/results/LegacyALevelBulkMarksEntryIntegrated';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Legacy A-Level Bulk Marks Entry Page
 *
 * This page serves as a wrapper for the LegacyALevelBulkMarksEntry component
 * and provides a notice to users about using the legacy implementation.
 */
const LegacyALevelBulkMarksEntryPage = () => {
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
        <Typography variant="h6" gutterBottom>
          Legacy A-Level Bulk Marks Entry
        </Typography>
        <Typography variant="body1" paragraph>
          You are using the legacy implementation of A-Level bulk marks entry. This implementation uses the old version's approach to bypass issues with the new implementation.
        </Typography>
        <Typography variant="body2" color="text.secondary">
            If you encounter any issues, please report them to the system administrator.
          </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button
              component={Link}
              to="/results/marks-entry-dashboard"
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Back to Dashboard
            </Button>
            <Button
              component={Link}
              to="/results/a-level/bulk-marks-entry"
              variant="contained"
              color="primary"
            >
              Switch to Standard Version
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <LegacyALevelBulkMarksEntryIntegrated />
    </Box>
  );
};

export default LegacyALevelBulkMarksEntryPage;
