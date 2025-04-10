import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
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
  Chip,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper
} from '@mui/material';
import {
  Class as ClassIcon,
  Book as BookIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

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

// Add prop type validation for TabPanel
TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const TeacherSubjectsClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const user = useSelector((state) => state.user?.user);

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoading(true);

      // Get teacher profile - don't rely on user._id from Redux store
      const profileResponse = await api.get('/api/teachers/profile/me');
      const teacherData = profileResponse.data;
      setTeacherProfile(teacherData);

      // If we have a teacher profile, fetch their classes with auto-assignment
      if (teacherData?._id) {
        try {
          console.log(`Fetching simple classes for teacher ${teacherData._id}...`);
          // Use the new simple-classes endpoint which is more reliable
          const classesResponse = await api.get(`/api/teachers/${teacherData._id}/simple-classes`);
          const classes = classesResponse.data || [];
          console.log(`Found ${classes.length} simple classes for teacher ${teacherData._id}`);

          // Set both classes and assignedClasses to the same data
          setClasses(classes);
          setAssignedClasses(classes);

          // If no classes were found, create a default class for this teacher
          if (classes.length === 0) {
            console.log('No classes found for teacher. Creating a default class...');
            setError('No classes assigned yet. Please contact an administrator to assign you to classes.');
          }
        } catch (classError) {
          console.error('Error fetching teacher classes:', classError);
          // Don't throw an error, just set empty arrays and show a message
          setClasses([]);
          setAssignedClasses([]);
          setError(`Failed to fetch assigned classes: ${classError.message}`);
          return; // Exit early to avoid further processing
        }
      } else {
        setError('Teacher profile ID not found');
        return; // Exit early to avoid further processing
      }

      // Extract unique subjects taught by this teacher
      const subjectsMap = new Map();

      // Get the classes from state instead of response data
      // Use for...of instead of forEach
      for (const cls of classes) {
        // Skip if subjects is undefined or not an array
        if (!cls.subjects || !Array.isArray(cls.subjects)) continue;

        // Process all subjects in the class (since we're using simple-classes endpoint)
        // Use for...of instead of forEach
        for (const subjectItem of cls.subjects) {
          if (!subjectsMap.has(subjectItem.subject._id)) {
            subjectsMap.set(subjectItem.subject._id, {
              id: subjectItem.subject._id,
              name: subjectItem.subject.name,
              code: subjectItem.subject.code,
              type: subjectItem.subject.type,
              description: subjectItem.subject.description,
              classes: []
            });
          }

          // Add this class to the subject's classes list
          subjectsMap.get(subjectItem.subject._id).classes.push({
            id: cls._id,
            name: cls.name,
            stream: cls.stream,
            section: cls.section
          });
        }
      }

      // Convert the map to an array
      const subjectsArray = Array.from(subjectsMap.values());

      // If no subjects were found, create a default one
      if (subjectsArray.length === 0) {
        console.log('No subjects found, creating a default subject');
        const defaultSubject = {
          id: 'default-subject',
          name: 'Default Subject',
          code: 'DEF',
          classes: [
            {
              id: 'default-class',
              name: 'Form 1',
              stream: 'A',
              section: 'Science'
            }
          ]
        };
        subjectsArray.push(defaultSubject);
      }

      setAssignedSubjects(subjectsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // We intentionally omit dependencies to avoid re-fetching

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // We now handle the case of no subjects in the fetchTeacherData function

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Teaching Assignments
        </Typography>
        {teacherProfile && (
          <Typography variant="subtitle1" color="text.secondary">
            <SafeDisplay value={teacherProfile.firstName} /> <SafeDisplay value={teacherProfile.lastName} /> - <SafeDisplay value={teacherProfile.employeeId} />
          </Typography>
        )}
      </Box>

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
          {assignedSubjects.length > 0 ? (
            <Grid container spacing={3}>
              {assignedSubjects.map((subject) => (
                <Grid item xs={12} sm={6} md={4} key={subject.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <BookIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            <SafeDisplay value={subject.name} />
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Code: <SafeDisplay value={subject.code} />
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={<SafeDisplay value={subject.type} />}
                        size="small"
                        color={subject.type === 'Core' ? 'primary' : 'secondary'}
                        sx={{ mb: 2 }}
                      />

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Classes Teaching This Subject:
                      </Typography>

                      <List dense>
                        {subject.classes.map((cls) => (
                          <ListItem key={cls.id}>
                            <ListItemIcon>
                              <ClassIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={<SafeDisplay value={cls.name} />}
                              secondary={<>
                                <SafeDisplay value={cls.stream} /> <SafeDisplay value={cls.section} />
                              </>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>

                    <CardActions>
                      <Button size="small" color="primary">
                        Enter Marks
                      </Button>
                      <Button size="small" color="primary">
                        View Results
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              You are not assigned to teach any subjects yet.
            </Alert>
          )}
        </TabPanel>

        {/* Classes Tab */}
        <TabPanel value={tabValue} index={1}>
          {assignedClasses.length > 0 ? (
            <Grid container spacing={3}>
              {assignedClasses.map((cls) => {
                // Filter subjects taught by this teacher in this class
                const teacherSubjects = cls.subjects.filter(
                  subject => subject.teacher && subject.teacher._id === teacherProfile._id
                );

                return (
                  <Grid item xs={12} sm={6} md={4} key={cls._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                            <ClassIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="div">
                              <SafeDisplay value={cls.name} />
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <SafeDisplay value={cls.stream} /> <SafeDisplay value={cls.section} />
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                          Subjects You Teach:
                        </Typography>

                        <List dense>
                          {teacherSubjects.map((subjectItem) => (
                            <ListItem key={subjectItem.subject._id}>
                              <ListItemIcon>
                                <BookIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={<SafeDisplay value={subjectItem.subject.name} />}
                                secondary={<SafeDisplay value={subjectItem.subject.code} />}
                              />
                            </ListItem>
                          ))}
                        </List>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            <strong>Students:</strong> <SafeDisplay value={cls.students?.length || 0} />
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions>
                        <Button size="small" color="primary">
                          Class Report
                        </Button>
                        <Button size="small" color="primary">
                          Send SMS
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ m: 2 }}>
              You are not assigned to any classes yet.
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TeacherSubjectsClasses;
