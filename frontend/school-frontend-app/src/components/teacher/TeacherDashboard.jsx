import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
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
      title: 'Student Management',
      description: 'Add or edit students',
      link: '/teacher/student-management'
    },
    {
      title: 'Import Students',
      description: 'Bulk import students via Excel',
      link: '/teacher/student-import',
      highlight: true
    },
    {
      title: 'Enter Marks',
      description: 'Record student marks and grades',
      link: '/results/marks-entry-dashboard',
      highlight: true
    },
    {
      title: 'View Results',
      description: 'Check student results',
      link: '/teacher/results'
    },
    {
      title: 'Reports',
      description: 'Generate student reports',
      link: '/teacher/result-reports',
      highlight: true
    },
    {
      title: 'SMS Notification',
      description: 'Send SMS to parents',
      link: '/teacher/sms-notification'
    },
    {
      title: 'Exams',
      description: 'View and manage exams',
      link: '/teacher/exams'
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
          Welcome
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to your teacher dashboard. Here you can manage your classes, grades, and student progress.
        </Typography>
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">
            <strong>IMPORTANT:</strong> The system now has a unified interface for both O-Level and A-Level marks entry and reporting. Use the <Link to="/results/marks-entry-dashboard" style={{ color: 'inherit', textDecoration: 'underline' }}>Enter Marks</Link> page to record student marks and the <Link to="/teacher/result-reports" style={{ color: 'inherit', textDecoration: 'underline' }}>Reports</Link> page to generate reports.
          </Typography>
        </Box>
        <Box sx={{ mb: 2, p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">
            <strong>FEATURES:</strong> The marks entry system provides powerful features including bulk entry, data validation, real-time grade calculation, and support for both O-Level and A-Level grading systems.
          </Typography>
        </Box>
        <Typography variant="body1" color="secondary">
          <strong>Need Help?</strong> Contact the system administrator if you encounter any issues or have questions about using the system.
        </Typography>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
