import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { Description as DescriptionIcon, School as SchoolIcon } from '@mui/icons-material';

/**
 * ResultReportSelectorWrapper Component
 *
 * This component provides direct links to the A-Level Class Report
 * and other report types without requiring a Router context.
 */
const ResultReportSelectorWrapper = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Result Reports
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          A-Level Reports
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SchoolIcon />}
              onClick={() => window.location.href = '/admin/a-level-class-reports'}
            >
              A-Level Class Reports
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<DescriptionIcon />}
              onClick={() => window.location.href = '/results/a-level-comprehensive-selector'}
            >
              A-Level Comprehensive Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          O-Level Reports
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SchoolIcon />}
              onClick={() => window.location.href = '/results/result-reports?tab=1&educationLevel=O_LEVEL'}
            >
              O-Level Class Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ResultReportSelectorWrapper;
