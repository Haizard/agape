import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import DashboardGrid from '../DashboardGrid';

const TeacherDashboard = () => {
  const dashboardItems = [
    {
      title: 'My Classes',
      description: 'View assigned classes',
      link: '/teacher/my-subjects'
    },
    {
      title: 'My Students',
      description: 'View all your students',
      link: '/teacher/my-students'
    },
    {
      title: 'Enter Marks',
      description: 'Record student marks',
      link: '/teacher/marks-entry'
    },
    {
      title: 'Enter Marks (New API)',
      description: 'Record marks with new API',
      link: '/teacher/enter-marks-new',
      highlight: true
    },
    {
      title: 'View Results',
      description: 'Check student results',
      link: '/teacher/results'
    },
    {
      title: 'Result Reports (New API)',
      description: 'Generate reports with new API',
      link: '/teacher/result-reports-new',
      highlight: true
    },
    {
      title: 'A-Level & O-Level Reports',
      description: 'Generate level-specific reports',
      link: '/teacher/result-reports',
      highlight: true
    },
    {
      title: 'A-Level Marks Entry',
      description: 'Enter marks for A-Level students',
      link: '/results/a-level/enter-marks',
      highlight: true
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Teacher Dashboard
      </Typography>
      <DashboardGrid items={dashboardItems} />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          New Features
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to your teacher dashboard. Here you can manage your classes, grades, and student progress.
        </Typography>
        <Typography variant="body1" color="secondary">
          <strong>New API Available:</strong> The system now has separate storage and reporting for O-LEVEL and A-LEVEL results. Try the new features highlighted above.
        </Typography>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
