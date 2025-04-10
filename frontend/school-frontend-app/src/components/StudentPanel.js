import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
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
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Email as EmailIcon,
  Announcement as AnnouncementIcon,
  Class as ClassIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';

import StudentDashboard from './student/StudentDashboard';
import PersonalInfo from './student/PersonalInfo';
import GradeView from './student/GradeView';
import ExamSchedule from './student/ExamSchedule';
import Communications from './student/Communications';
import CourseManagement from './student/CourseManagement';
import AssignmentView from './student/AssignmentView';
import AttendanceView from './student/AttendanceView';
import Announcements from './student/Announcements';
import TimeTable from './student/TimeTable';
import StudyMaterials from './student/StudyMaterials';

const StudentPanel = () => {
  const { user } = useContext(UserContext);

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile' },
    { text: 'My Courses', icon: <ClassIcon />, path: '/student/courses' },
    { text: 'Time Table', icon: <CalendarTodayIcon />, path: '/student/timetable' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'My Grades', icon: <AssessmentIcon />, path: '/student/grades' },
    { text: 'Exam Schedule', icon: <ScheduleIcon />, path: '/student/exams' },
    { text: 'Attendance', icon: <EventNoteIcon />, path: '/student/attendance' },
    { text: 'Study Materials', icon: <MenuBookIcon />, path: '/student/materials' }
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
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<PersonalInfo />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="timetable" element={<TimeTable />} />
          <Route path="assignments" element={<AssignmentView />} />
          <Route path="grades" element={<GradeView />} />
          <Route path="exams" element={<ExamSchedule />} />
          <Route path="attendance" element={<AttendanceView />} />
          <Route path="materials" element={<StudyMaterials />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="messages" element={<Communications />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default StudentPanel;


