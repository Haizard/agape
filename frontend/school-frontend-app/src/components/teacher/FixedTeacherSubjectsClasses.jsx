import React, { useState, useEffect, useCallback } from 'react';
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

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const FixedTeacherSubjectsClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [classes, setClasses] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const user = useSelector((state) => state.user?.user);

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching teacher data...');

      // Step 1: Get the teacher profile
      const profileResponse = await api.get('/api/teachers/profile/me');
      const teacherData = profileResponse.data;
      console.log('Teacher profile:', teacherData);
      setTeacherProfile(teacherData);

      if (!teacherData || !teacherData._id) {
        setError('Teacher profile not found. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Step 2: Get all classes where this teacher teaches using the new endpoint
      console.log(`Fetching classes for teacher ${teacherData._id} using new endpoint...`);
      const classesResponse = await api.get('/api/teacher-classes/my-classes');

      let classesData = classesResponse.data || [];
      console.log(`Found ${classesData.length} classes for teacher ${teacherData._id}`);

      // If no classes found, try the original endpoints as fallback
      if (classesData.length === 0) {
        console.log('No classes found, trying original endpoints as fallback...');

        // Try the classes endpoint with teacher filter
        const originalClassesResponse = await api.get('/api/classes', {
          params: {
            teacher: teacherData._id
          }
        });

        classesData = originalClassesResponse.data || [];
        console.log(`Found ${classesData.length} classes from original endpoint`);

        // If still no classes, try the simple-classes endpoint
        if (classesData.length === 0) {
          console.log('Still no classes, trying simple-classes endpoint...');
          const simpleClassesResponse = await api.get('/api/teachers/simple-classes');
          classesData = simpleClassesResponse.data || [];
          console.log(`Found ${classesData.length} simple classes`);
        }
      }

      // Set the classes data
      setClasses(classesData);
      setAssignedClasses(classesData);

      // Step 3: Get subjects directly from the new endpoint
      console.log(`Fetching subjects for teacher ${teacherData._id} using new endpoint...`);
      try {
        const subjectsResponse = await api.get('/api/teacher-classes/my-subjects');
        const subjectsData = subjectsResponse.data || [];
        console.log(`Found ${subjectsData.length} subjects from new endpoint`);

        // Format the subjects data
        const formattedSubjects = subjectsData.map(subject => ({
          id: subject._id,
          name: subject.name || 'Unknown Subject',
          code: subject.code || 'N/A',
          type: subject.type || 'N/A',
          description: subject.description || '',
          classes: Array.isArray(subject.classes) ? subject.classes.map(cls => ({
            id: cls._id,
            name: cls.name || 'Unknown Class',
            stream: cls.stream || '',
            section: cls.section || ''
          })) : []
        }));

        setAssignedSubjects(formattedSubjects);

        // If no subjects were found, fall back to extracting from classes
        if (formattedSubjects.length === 0) {
          console.log('No subjects found from endpoint, extracting from classes...');

          // Extract subjects from classes (original method)
          const subjectsMap = new Map();

          // Process each class
          for (const cls of classesData) {
            // Skip if subjects is undefined or not an array
            if (!cls.subjects || !Array.isArray(cls.subjects)) {
              continue;
            }

            // Process each subject in the class
            for (const subjectItem of cls.subjects) {
              // Skip if subject is not assigned to this teacher
              if (!subjectItem.teacher ||
                  (subjectItem.teacher._id !== teacherData._id &&
                   subjectItem.teacher !== teacherData._id)) {
                continue;
              }

              const subject = subjectItem.subject;
              if (!subject) continue;

              const subjectId = typeof subject === 'object' ? subject._id : subject;

              if (!subjectsMap.has(subjectId)) {
                subjectsMap.set(subjectId, {
                  id: subjectId,
                  name: typeof subject === 'object' ? subject.name : 'Unknown Subject',
                  code: typeof subject === 'object' ? subject.code : 'N/A',
                  type: typeof subject === 'object' ? subject.type : 'N/A',
                  description: typeof subject === 'object' ? subject.description : '',
                  classes: []
                });
              }

              // Add this class to the subject's classes list
              subjectsMap.get(subjectId).classes.push({
                id: cls._id,
                name: cls.name,
                stream: cls.stream,
                section: cls.section
              });
            }
          }

          // Convert the map to an array
          const subjectsArray = Array.from(subjectsMap.values());
          console.log(`Extracted ${subjectsArray.length} subjects from classes`);

          if (subjectsArray.length > 0) {
            setAssignedSubjects(subjectsArray);
          } else {
            // If still no subjects, create a default one
            console.log('No subjects found, creating a default subject');
            const defaultSubject = {
              id: 'default-subject',
              name: 'Default Subject',
              code: 'DEF',
              type: 'Core',
              classes: classesData.map(cls => ({
                id: cls._id,
                name: cls.name,
                stream: cls.stream,
                section: cls.section
              }))
            };
            setAssignedSubjects([defaultSubject]);
          }
        }
      } catch (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);

        // Create a default subject as fallback
        const defaultSubject = {
          id: 'default-subject',
          name: 'Default Subject',
          code: 'DEF',
          type: 'Core',
          classes: classesData.map(cls => ({
            id: cls._id,
            name: cls.name,
            stream: cls.stream,
            section: cls.section
          }))
        };
        setAssignedSubjects([defaultSubject]);
      }

    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchTeacherData();
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
              <SafeDisplay value={teacherProfile.firstName} /> <SafeDisplay value={teacherProfile.lastName} /> - <SafeDisplay value={teacherProfile.employeeId} />
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
              You are not assigned to teach any subjects yet. Please contact an administrator to assign you to subjects.
            </Alert>
          )}
        </TabPanel>

        {/* Classes Tab */}
        <TabPanel value={tabValue} index={1}>
          {assignedClasses.length > 0 ? (
            <Grid container spacing={3}>
              {assignedClasses.map((cls) => {
                // Filter subjects taught by this teacher in this class
                const teacherSubjects = cls.subjects && Array.isArray(cls.subjects)
                  ? cls.subjects.filter(
                      subject => subject.teacher &&
                      (subject.teacher._id === teacherProfile._id ||
                       subject.teacher === teacherProfile._id)
                    )
                  : [];

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
                          {teacherSubjects.length > 0 ? (
                            teacherSubjects.map((subjectItem) => (
                              <ListItem key={subjectItem.subject._id || 'unknown'}>
                                <ListItemIcon>
                                  <BookIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={<SafeDisplay value={
                                    subjectItem.subject.name ||
                                    (typeof subjectItem.subject === 'string' ? 'Subject' : 'Unknown Subject')
                                  } />}
                                  secondary={<SafeDisplay value={
                                    subjectItem.subject.code ||
                                    (typeof subjectItem.subject === 'string' ? 'Code' : 'N/A')
                                  } />}
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
              You are not assigned to any classes yet. Please contact an administrator to assign you to classes.
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default FixedTeacherSubjectsClasses;
