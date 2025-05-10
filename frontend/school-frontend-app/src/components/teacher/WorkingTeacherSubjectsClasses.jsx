import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Book as BookIcon,
  Class as ClassIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleaningServicesIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import apiService from '../../services/unifiedApi';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const user = useSelector((state) => state.user?.user);

  const fetchTeacherData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch teacher profile - try multiple endpoints
      let profileResponse;
      try {
        // First try the enhanced endpoint
        profileResponse = await apiService.get('/api/enhanced-teachers/profile');
        console.log('Successfully fetched teacher profile from enhanced endpoint');
        setTeacherProfile(profileResponse.teacher);
      } catch (profileError) {
        console.log('Enhanced endpoint failed, trying original endpoint');
        try {
          // Then try the original endpoint
          profileResponse = await apiService.get('/api/teachers/profile/me');
          console.log('Successfully fetched teacher profile from original endpoint');
          setTeacherProfile(profileResponse.teacher);
        } catch (originalProfileError) {
          console.log('Original endpoint failed, trying teacher-classes endpoint');
          try {
            // Finally try the teacher-classes endpoint
            const teacherClassesResponse = await apiService.get('/api/teacher-classes/my-classes');
            if (teacherClassesResponse?.teacher) {
              console.log('Successfully fetched teacher profile from teacher-classes endpoint');
              setTeacherProfile(teacherClassesResponse.teacher);
            } else {
              throw new Error('No teacher profile found in response');
            }
          } catch (finalError) {
            console.error('All profile endpoints failed:', finalError);
            throw new Error('Failed to fetch teacher profile from any endpoint');
          }
        }
      }

      // Fetch teacher classes - try multiple endpoints
      let classesResponse;
      try {
        // First try the enhanced endpoint
        classesResponse = await apiService.get('/api/classes/teacher/me');
        console.log('Successfully fetched teacher classes from enhanced endpoint');
        setClasses(classesResponse);
      } catch (classesError) {
        console.log('Enhanced classes endpoint failed, trying original endpoint');
        try {
          // Then try the original endpoint
          classesResponse = await apiService.get('/api/teacher-classes/my-classes');
          console.log('Successfully fetched teacher classes from original endpoint');
          setClasses(classesResponse?.classes || []);
        } catch (originalClassesError) {
          console.error('All classes endpoints failed:', originalClassesError);
          setClasses([]);
        }
      }

      // Fetch teacher subjects - try multiple endpoints
      let subjectsResponse;
      try {
        // First try the enhanced endpoint
        subjectsResponse = await apiService.get('/api/subjects/teacher/me');
        console.log('Successfully fetched teacher subjects from enhanced endpoint');
        setSubjects(subjectsResponse);
      } catch (subjectsError) {
        console.log('Enhanced subjects endpoint failed, trying original endpoint');
        try {
          // Then try the original endpoint
          subjectsResponse = await apiService.get('/api/teacher-classes/my-subjects');
          console.log('Successfully fetched teacher subjects from original endpoint');
          setSubjects(subjectsResponse?.subjects || []);
        } catch (originalSubjectsError) {
          console.error('All subjects endpoints failed:', originalSubjectsError);
          setSubjects([]);
        }
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError('Failed to load teacher data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await fetchTeacherData();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchTeacherData]);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  // Handle cleanup of unused subject assignments
  const handleCleanup = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);

    try {
      const response = await apiService.post('/api/teachers/cleanup-subject-assignments');
      console.log('Cleanup response:', response);

      setCleanupResult(response);

      if (response.removedSubjects && response.removedSubjects.length > 0) {
        setSnackbarMessage(`Successfully removed ${response.removedSubjects.length} unused subject assignments`);
      } else {
        setSnackbarMessage('No unused subject assignments found');
      }
      setSnackbarOpen(true);

      await fetchTeacherData();
    } catch (error) {
      console.error('Error cleaning up subject assignments:', error);
      setCleanupResult({
        success: false,
        message: 'Failed to clean up subject assignments',
        error: error.message
      });
      setSnackbarMessage('Failed to clean up subject assignments');
      setSnackbarOpen(true);
    } finally {
      setCleanupLoading(false);
    }
  };

  // Handle deleting a subject assignment
  const handleDeleteSubject = async (subjectId, subjectName) => {
    try {
      setLoading(true);

      const response = await apiService.delete(`/api/teachers/subject-assignment/${subjectId}`);
      console.log('Delete subject response:', response);

      setSnackbarMessage(`Successfully removed ${subjectName} from your assignments`);
      setSnackbarOpen(true);

      await fetchTeacherData();
    } catch (error) {
      console.error('Error deleting subject assignment:', error);
      setSnackbarMessage(`Failed to remove ${subjectName} from your assignments`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the cleanup dialog
  const handleOpenCleanupDialog = () => {
    setCleanupDialogOpen(true);
  };

  // Handle closing the cleanup dialog
  const handleCloseCleanupDialog = () => {
    setCleanupDialogOpen(false);
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchTeacherData();
  }, [fetchTeacherData]);

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleOpenCleanupDialog}
            disabled={loading || cleanupLoading}
            startIcon={<CleaningServicesIcon />}
          >
            Clean Up Unused Subjects
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Refresh Data
          </Button>
        </Box>
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
          {/* Separate unused subjects */}
          {subjects.some(subject => !subject.classes || subject.classes.length === 0) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" color="error" gutterBottom>
                Unused Subject Assignments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These subjects are assigned to you but you don't teach them in any class. You can remove them to clean up your dashboard.
              </Typography>
              <Grid container spacing={3}>
                {subjects
                  .filter(subject => !subject.classes || subject.classes.length === 0)
                  .map((subject) => (
                    <Grid item xs={12} sm={6} md={4} key={subject._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #f44336' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
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

                          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'error.main' }}>
                            No Classes Assigned
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            onClick={() => handleDeleteSubject(subject._id, subject.name)}
                            startIcon={<DeleteIcon />}
                          >
                            Remove Unused Subject
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}

          {/* Active subjects */}
          {subjects.some(subject => subject.classes && subject.classes.length > 0) && (
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>
                Active Teaching Assignments
              </Typography>
              <Grid container spacing={3}>
                {subjects
                  .filter(subject => subject.classes && subject.classes.length > 0)
                  .map((subject) => (
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
            </Box>
          )}

          {subjects.length === 0 && (
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
                    </CardContent>
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

      {/* Cleanup Dialog */}
      <Dialog
        open={cleanupDialogOpen}
        onClose={handleCloseCleanupDialog}
        aria-labelledby="cleanup-dialog-title"
        aria-describedby="cleanup-dialog-description"
      >
        <DialogTitle id="cleanup-dialog-title">
          Clean Up Unused Subject Assignments
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cleanup-dialog-description">
            This will remove all subject assignments that are not associated with any classes.
            These are subjects that appear in your profile but you don't actually teach in any class.
            This action cannot be undone.
          </DialogContentText>

          {cleanupResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={cleanupResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {cleanupResult.message}
              </Alert>

              {cleanupResult.removedSubjects && cleanupResult.removedSubjects.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Removed Subjects:
                  </Typography>
                  <List dense>
                    {cleanupResult.removedSubjects.map((subject) => (
                      <ListItem key={subject._id}>
                        <ListItemIcon>
                          <BookIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={subject.name}
                          secondary={`Code: ${subject.code}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCleanupDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleCleanup}
            color="secondary"
            disabled={cleanupLoading}
            startIcon={cleanupLoading ? <CircularProgress size={20} /> : <CleaningServicesIcon />}
          >
            {cleanupLoading ? 'Cleaning...' : 'Clean Up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default WorkingTeacherSubjectsClasses;
