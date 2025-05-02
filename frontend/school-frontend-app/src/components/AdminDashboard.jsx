import React from 'react';
import { Box, Typography, Grid, Paper, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardGrid from './DashboardGrid';
import axios from 'axios';
import { motion } from 'framer-motion';

// Import enhanced components
import {
  PageHeader,
  SectionContainer,
  AnimatedContainer,
  FadeIn
} from './common';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: 'User Management',
      description: 'Manage teachers and students',
      link: '/admin/user-management'
    },
    {
      title: 'Academic Management',
      description: 'Manage classes and subjects',
      link: '/admin/academic-management'
    },
    {
      title: 'Academic Year',
      description: 'Manage academic years and terms',
      link: '/admin/academic-years'
    },
    {
      title: 'Assessment Management',
      description: 'Manage exams and results',
      link: '/admin/assessment-management'
    },
    {
      title: 'Reports',
      description: 'Generate student reports',
      link: '/admin/result-reports',
      highlight: true
    },
  ];

  return (
    <AnimatedContainer animation="fadeIn" duration={0.8}>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Manage all aspects of your school system"
          color="primary"
        />

        <FadeIn delay={0.2}>
          <DashboardGrid items={dashboardItems} />
        </FadeIn>

        <FadeIn delay={0.3}>
          <SectionContainer sx={{ mt: 4, p: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                position: 'relative',
                pb: 1,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '40px',
                  height: '3px',
                  backgroundColor: 'primary.main',
                  borderRadius: '2px'
                }
              }}
            >
              Welcome
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to the admin dashboard. Here you can manage all aspects of the school system.
            </Typography>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="body1">
                <strong>IMPORTANT:</strong> The system now has a unified interface for both O-Level and A-Level marks entry and reporting. Use the <Button variant="text" onClick={() => navigate('/admin/result-reports')} sx={{ color: 'inherit', textDecoration: 'underline', p: 0, minWidth: 'auto', fontWeight: 'bold' }}>Reports</Button> page to generate student reports.
              </Typography>
            </Alert>
          </SectionContainer>
        </FadeIn>
      </Box>
    </AnimatedContainer>
  );
};

export default AdminDashboard;



