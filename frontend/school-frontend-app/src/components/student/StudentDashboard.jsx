import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';

const DashboardCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color={color}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element.isRequired,
  color: PropTypes.string.isRequired
};

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get('/api/students/dashboard', {
          params: {
            userId: user.id // from auth context
          }
        });
        
        // Response should include:
        // - Student details (name, class, roll number)
        // - Current academic progress
        // - Recent exam results
        // - Attendance statistics
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      }
    };

    fetchStudentData();
  }, [user.id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!dashboardData) {
    return <Alert severity="info">No dashboard data available.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user.username}!
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Average Grade"
            value={dashboardData.averageGrade + '%'}
            icon={<AssessmentIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Assignments"
            value={dashboardData.pendingAssignments}
            icon={<AssignmentIcon color="warning" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Attendance Rate"
            value={dashboardData.attendanceRate + '%'}
            icon={<EventNoteIcon color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="New Announcements"
            value={dashboardData.newAnnouncements}
            icon={<AnnouncementIcon color="info" />}
            color="info"
          />
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Upcoming Events
      </Typography>
      <Grid container spacing={2}>
        {dashboardData.upcomingEvents.map((event, index) => (
          <Grid item xs={12} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6">{event.title}</Typography>
                <Typography color="textSecondary">
                  {new Date(event.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">{event.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
