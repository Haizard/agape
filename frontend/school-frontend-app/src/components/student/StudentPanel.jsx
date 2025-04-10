import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Box, Container, Grid, Paper, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Assessment as AssessmentIcon,
  Announcement as AnnouncementIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import StudentDashboard from './StudentDashboard';
import StudentSubjects from './StudentSubjects';
import GradeView from './GradeView';
import AssignmentView from './AssignmentView';
import TimeTable from './TimeTable';
import Announcements from './Announcements';

const StudentPanel = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'My Subjects', icon: <BookIcon />, path: '/student/subjects' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'Timetable', icon: <EventNoteIcon />, path: '/student/timetable' },
    { text: 'Grades & Results', icon: <AssessmentIcon />, path: '/student/grades' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/student/announcements' },
    { text: 'Profile', icon: <PersonIcon />, path: '/student/profile' }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" color="primary" sx={{ p: 2, pb: 1 }}>
              Student Portal
            </Typography>
            <List component="nav">
              {menuItems.map((item) => (
                <ListItem button component={Link} to={item.path} key={item.text}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/subjects" element={<StudentSubjects />} />
              <Route path="/assignments" element={<AssignmentView />} />
              <Route path="/timetable" element={<TimeTable />} />
              <Route path="/grades" element={<GradeView />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/profile" element={<PersonIcon />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentPanel;
