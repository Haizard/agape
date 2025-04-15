import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Dashboard Component
 *
 * Main dashboard for the application
 */
const Dashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Academic Management
            </Typography>
            <Typography variant="body1" paragraph>
              Manage academic years, terms, classes, and subjects.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/academic/unified"
            >
              Go to Academic Management
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Marks Entry
            </Typography>
            <Typography variant="body1" paragraph>
              Enter and manage student marks, with offline capability.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/results/marks-entry-dashboard"
              sx={{ mr: 2 }}
            >
              Marks Entry Dashboard
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/marks/offline-entry"
            >
              Offline Marks Entry
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Student Reports
            </Typography>
            <Typography variant="body1" paragraph>
              Generate and download student reports for O-Level and A-Level.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/reports/student"
              sx={{ mr: 2 }}
            >
              Individual Reports
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/reports/batch-download"
            >
              Batch Download
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1" paragraph>
              Configure system settings and user preferences.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/settings"
            >
              Go to Settings
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
