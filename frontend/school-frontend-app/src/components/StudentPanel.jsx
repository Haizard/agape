import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import SafeDisplay from './common/SafeDisplay';
import { UserContext } from '../contexts/UserContext';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Email as EmailIcon,
  Announcement as AnnouncementIcon,
  Class as ClassIcon
} from '@mui/icons-material';

import StudentDashboard from './student/StudentDashboard';
import StudentProfile from './student/StudentProfile';
import GradeView from './student/GradeView';
import ExamSchedule from './student/ExamSchedule';
import CourseManagement from './student/CourseManagement';
import AssignmentView from './student/AssignmentView';
import AttendanceView from './student/AttendanceView';
import StudentAnnouncements from './student/StudentAnnouncements';
import StudentSubjects from './student/StudentSubjects';

const StudentPanel = () => {
  const { user } = useContext(UserContext);

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile' },
    { text: 'My Grades', icon: <AssessmentIcon />, path: '/student/grades' },
    { text: 'Exam Schedule', icon: <ScheduleIcon />, path: '/student/exams' },
    { text: 'My Subjects', icon: <BookIcon />, path: '/student/subjects' },
    { text: 'My Courses', icon: <ClassIcon />, path: '/student/courses' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'Attendance', icon: <EventNoteIcon />, path: '/student/attendance' },
    { text: 'Study Materials', icon: <AssignmentIcon />, path: '/student/materials' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/student/announcements' },
    { text: 'Messages', icon: <EmailIcon />, path: '/student/messages' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            <SafeDisplay value={user.username} fallback="Student" />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Student Panel
          </Typography>
        </Box>
        <Divider />
        <List>
          {navigationItems.map((item) => (
            <ListItem button key={item.text} component="a" href={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="grades" element={<GradeView />} />
          <Route path="exams" element={<ExamSchedule />} />
          <Route path="subjects" element={<StudentSubjects />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="assignments" element={<AssignmentView />} />
          <Route path="attendance" element={<AttendanceView />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default StudentPanel;