import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import EmailIcon from '@mui/icons-material/Email';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useSelector((state) => state.user.user);

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile' },
    { text: 'My Courses', icon: <ClassIcon />, path: '/student/courses' },
    { text: 'Time Table', icon: <CalendarTodayIcon />, path: '/student/timetable' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'My Grades', icon: <AssessmentIcon />, path: '/student/grades' },
    { text: 'Exam Schedule', icon: <ScheduleIcon />, path: '/student/exams' },
    { text: 'Attendance', icon: <EventNoteIcon />, path: '/student/attendance' },
    { text: 'Study Materials', icon: <MenuBookIcon />, path: '/student/materials' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/student/announcements' },
    { text: 'Messages', icon: <EmailIcon />, path: '/student/messages' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('/api/announcements/student', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setAnnouncements(response.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch announcements: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'error';
      case 'normal':
        return 'primary';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading announcements...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Announcements
      </Typography>

      <Grid container spacing={2}>
        {announcements.map((announcement) => (
          <Grid item xs={12} key={announcement._id}>
            <Card 
              sx={{ 
                '&:hover': {
                  boxShadow: 3,
                  transition: 'box-shadow 0.3s ease-in-out'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{announcement.title}</Typography>
                  <Chip 
                    label={announcement.priority}
                    color={getPriorityColor(announcement.priority)}
                    size="small"
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {announcement.content}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Class: {announcement.class}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Posted: {new Date(announcement.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        
        {announcements.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              No announcements available at this time.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Announcements;



