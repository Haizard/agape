import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Class as ClassIcon,
  Book as BookIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PropTypes from 'prop-types';

// TabPanel component for the tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const WorkingTeacherSubjectsClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const user = useSelector((state) => state.user?.user);

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get the teacher profile
        try {
          const profileResponse = await api.get('/api/teachers/profile/me');
          setTeacherProfile(profileResponse.data);
        } catch (profileError) {
          console.log('Error fetching teacher profile:', profileError);
          // Continue even if profile fetch fails
        }

        // Try to get teacher's classes
        try {
          const classesResponse = await api.get('/api/teacher-classes/my-classes');
          setClasses(classesResponse.data);
        } catch (classesError) {
          console.log('Error fetching teacher classes:', classesError);

          // If user is admin, try to get all classes
          if (user?.role === 'admin') {
            const allClassesResponse = await api.get('/api/classes');
            setClasses(allClassesResponse.data);
          } else {
            // Create a default class if no classes found
            setClasses([{
              _id: 'default-class',
              name: 'Default Class',
              stream: 'A',
              section: 'General'
            }]);
          }
        }

        // Try to get teacher's subjects
        try {
          const subjectsResponse = await api.get('/api/teacher-classes/my-subjects');
          setSubjects(subjectsResponse.data);
        } catch (subjectsError) {
          console.log('Error fetching teacher subjects:', subjectsError);

          // Create default subjects with a default class
          // This avoids dependency on the classes state variable
          setSubjects([{
            _id: 'default-subject',
            name: 'Default Subject',
            code: 'DEF',
            type: 'Core',
            classes: [{
              _id: 'default-class',
              name: 'Default Class',
              stream: 'A',
              section: 'General'
            }]
          }]);
        }
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user]);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get the teacher profile
      try {
        const profileResponse = await api.get('/api/teachers/profile/me');
        setTeacherProfile(profileResponse.data);
      } catch (profileError) {
        console.log('Error fetching teacher profile:', profileError);
        // Continue even if profile fetch fails
      }

      // Try to get teacher's classes
      try {
        const classesResponse = await api.get('/api/teacher-classes/my-classes');
        setClasses(classesResponse.data);
      } catch (classesError) {
        console.log('Error fetching teacher classes:', classesError);

        // If user is admin, try to get all classes
        if (user?.role === 'admin') {
          const allClassesResponse = await api.get('/api/classes');
          setClasses(allClassesResponse.data);
        } else {
          // Create a default class if no classes found
          setClasses([{
            _id: 'default-class',
            name: 'Default Class',
            stream: 'A',
            section: 'General'
          }]);
        }
      }

      // Try to get teacher's subjects
      try {
        const subjectsResponse = await api.get('/api/teacher-classes/my-subjects');
        setSubjects(subjectsResponse.data);
      } catch (subjectsError) {
        console.log('Error fetching teacher subjects:', subjectsError);

        // Create default subjects with a default class
        setSubjects([{
          _id: 'default-subject',
          name: 'Default Subject',
          code: 'DEF',
          type: 'Core',
          classes: [{
            _id: 'default-class',
            name: 'Default Class',
            stream: 'A',
            section: 'General'
          }]
        }]);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Safe render function for values that might be undefined
  const safeRender = (value, fallback = '-') => {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return value;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography variant="h4" gutterBottom>
            My Teaching Assignments
          </Typography>
          {teacherProfile && (
            <Typography variant="subtitle1" color="text.secondary">
              {safeRender(teacherProfile.firstName)} {safeRender(teacherProfile.lastName)} - {safeRender(teacherProfile.employeeId)}
            </Typography>
          )}
        </div>
        <Button variant="outlined" onClick={handleRefresh} disabled={loading}>
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="My Subjects" icon={<BookIcon />} iconPosition="start" />
          <Tab label="My Classes" icon={<ClassIcon />} iconPosition="start" />
        </Tabs>

        {/* Subjects Tab */}
        <TabPanel value={tabValue} index={0}>
          {subjects.length > 0 ? (
            <Grid container spacing={3}>
              {subjects.map((subject) => (
                <Grid item xs={12} sm={6} md={4} key={subject._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <BookIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {safeRender(subject.name)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Code: {safeRender(subject.code)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Classes Teaching This Subject:
                      </Typography>

                      <List dense>
                        {subject.classes && subject.classes.length > 0 ? (
                          subject.classes.map((cls) => (
                            <ListItem key={cls._id}>
                              <ListItemIcon>
                                <ClassIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={safeRender(cls.name)}
                                secondary={<>
                                  {safeRender(cls.stream)} {safeRender(cls.section)}
                                </>}
                              />
                            </ListItem>
                          ))
                        ) : (
                          <ListItem>
                            <ListItemText primary="No classes assigned yet" />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    <CardActions>
                      <Tooltip title="Enter marks for this subject">
                        <Button
                          size="small"
                          color="primary"
                          component={Link}
                          to={`/results/marks-entry-dashboard?subject=${subject._id}`}
                          startIcon={<EditIcon />}
                        >
                          Enter Marks
                        </Button>
                      </Tooltip>
                      <Tooltip title="View results for this subject">
                        <Button
                          size="small"
                          color="secondary"
                          component={Link}
                          to={`/teacher/results?subject=${subject._id}`}
                          startIcon={<AssessmentIcon />}
                        >
                          View Results
                        </Button>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              You are not assigned to teach any subjects yet. Please contact an administrator to assign you to subjects.
            </Alert>
          )}
        </TabPanel>

        {/* Classes Tab */}
        <TabPanel value={tabValue} index={1}>
          {classes.length > 0 ? (
            <Grid container spacing={3}>
              {classes.map((cls) => (
                <Grid item xs={12} sm={6} md={4} key={cls._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                          <ClassIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {safeRender(cls.name)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {safeRender(cls.stream)} {safeRender(cls.section)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Subjects You Teach:
                      </Typography>

                      <List dense>
                        {cls?.subjects && cls.subjects.length > 0 ? (
                          cls?.subjects
                            .filter(subjectItem =>
                              subjectItem?.teacher &&
                              teacherProfile &&
                              (subjectItem.teacher?._id === teacherProfile?._id ||
                               subjectItem.teacher === teacherProfile?._id)
                            )
                            .map((subjectItem) => (
                              <ListItem key={subjectItem?.subject?._id || 'unknown'}>
                                <ListItemIcon>
                                  <BookIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={safeRender(
                                    subjectItem?.subject?.name ||
                                    (typeof subjectItem?.subject === 'string' ? 'Subject' : 'Unknown Subject')
                                  )}
                                  secondary={safeRender(
                                    subjectItem?.subject?.code ||
                                    (typeof subjectItem?.subject === 'string' ? 'Code' : 'N/A')
                                  )}
                                />
                              </ListItem>
                            ))
                        ) : (
                          <ListItem>
                            <ListItemText primary="No subjects assigned yet" />
                          </ListItem>
                        )}
                      </List>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Students:</strong> {safeRender(cls.students?.length || 0)}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Tooltip title="View class results">
                        <Button
                          size="small"
                          color="primary"
                          component={Link}
                          to={`/teacher/results?class=${cls._id}`}
                          startIcon={<AssessmentIcon />}
                        >
                          Class Results
                        </Button>
                      </Tooltip>
                      <Tooltip title="Send SMS notifications">
                        <Button
                          size="small"
                          color="secondary"
                          component={Link}
                          to={`/teacher/sms-notification?class=${cls._id}`}
                          startIcon={<NotificationsIcon />}
                        >
                          Send SMS
                        </Button>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              You are not assigned to any classes yet. Please contact an administrator to assign you to classes.
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default WorkingTeacherSubjectsClasses;
