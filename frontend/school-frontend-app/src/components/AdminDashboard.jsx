import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardGrid from './DashboardGrid';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: 'Total Students',
      description: '250 Students',
    },
    {
      title: 'Total Teachers',
      description: '25 Teachers',
    },
    {
      title: 'Active Classes',
      description: '12 Classes',
    },
    {
      title: 'Recent Results',
      description: '15 New Results',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <DashboardGrid items={dashboardItems} />
      
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Teacher Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/admin/teachers')}
              fullWidth
            >
              Manage Teachers
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Academic Year
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/admin/academic-years')}
              fullWidth
            >
              Manage Academic Years
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;



