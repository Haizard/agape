import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Check, Error, Refresh, Assignment, School, Person, Subject, Info } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeacherAssignmentManager = () => {
  // State for selections
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  
  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: '',
    content: '',
    action: null
  });

  const { user } = useAuth();

  // Fetch initial data
  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, []);

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to fetch teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to fetch classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects for a class
  const fetchSubjectsForClass = async (classId) => {
    if (!classId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/classes/${classId}/subjects`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher's subjects in a class
  const fetchTeacherSubjects = async () => {
    if (!selectedTeacher || !selectedClass) {
      setTeacherSubjects([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/api/fix-teacher/teacher-subjects/${selectedTeacher}/${selectedClass}`);
      setTeacherSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      setError('Failed to fetch teacher subjects. Please try again.');
      setTeacherSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher's classes
  const fetchTeacherClasses = async () => {
    if (!selectedTeacher) {
      setTeacherClasses([]);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/api/fix-teacher/teacher-classes/${selectedTeacher}`);
      setTeacherClasses(response.data.classes);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      setError('Failed to fetch teacher classes. Please try again.');
      setTeacherClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle class change
  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    setSelectedSubjects([]);
    fetchSubjectsForClass(classId);
  };

  // Handle teacher change
  const handleTeacherChange = (event) => {
    const teacherId = event.target.value;
    setSelectedTeacher(teacherId);
    setTeacherSubjects([]);
    setDiagnosticResult(null);
    
    if (teacherId) {
      fetchTeacherClasses();
    } else {
      setTeacherClasses([]);
    }
  };

  // Handle subject selection change
  const handleSubjectChange = (event) => {
    setSelectedSubjects(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
    setDiagnosticResult(null);
  };

  // Fix teacher assignments
  const handleFixAssignments = async () => {
    if (!selectedTeacher || !selectedClass) {
      setError('Please select a teacher and a class.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Get the teacher details
      const teacher = teachers.find(t => t._id === selectedTeacher);
      if (!teacher) {
        setError('Selected teacher not found.');
        return;
      }

      // Confirm before proceeding
      setDialogContent({
        title: 'Confirm Assignment Fix',
        content: `This will assign ${teacher.firstName} ${teacher.lastName} to ALL subjects in the selected class. Continue?`,
        action: async () => {
          try {
            const response = await api.post('/api/fix-teacher/fix-teacher-assignments', {
              username: teacher.username || teacher.email.split('@')[0],
              classId: selectedClass
            });

            setSuccess('Teacher assignments fixed successfully!');
            setDiagnosticResult(response.data);
            fetchTeacherSubjects();
            fetchTeacherClasses();
          } catch (error) {
            console.error('Error fixing assignments:', error);
            setError(`Failed to fix assignments: ${error.response?.data?.message || error.message}`);
          } finally {
            setLoading(false);
            setOpenDialog(false);
          }
        }
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error preparing fix:', error);
      setError(`Failed to prepare fix: ${error.message}`);
      setLoading(false);
    }
  };

  // Diagnose teacher assignments
  const handleDiagnoseAssignments = async () => {
    if (!selectedTeacher || !selectedClass) {
      setError('Please select a teacher and a class.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Get the teacher details
      const teacher = teachers.find(t => t._id === selectedTeacher);
      if (!teacher) {
        setError('Selected teacher not found.');
        return;
      }

      const response = await api.post('/api/fix-teacher/diagnose-and-fix', {
        username: teacher.username || teacher.email.split('@')[0],
        classId: selectedClass
      });

      setDiagnosticResult(response.data);
      
      if (response.data.success) {
        if (response.data.issues && response.data.issues.length > 0) {
          setSuccess('Diagnosis complete. Issues were found and fixed.');
        } else {
          setSuccess('Diagnosis complete. No issues found.');
        }
      } else {
        setError(`Diagnosis failed: ${response.data.message}`);
      }

      fetchTeacherSubjects();
      fetchTeacherClasses();
    } catch (error) {
      console.error('Error diagnosing assignments:', error);
      setError(`Failed to diagnose assignments: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assign selected subjects to teacher
  const handleAssignSelectedSubjects = async () => {
    if (!selectedTeacher || !selectedClass || selectedSubjects.length === 0) {
      setError('Please select a teacher, class, and at least one subject.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Use the existing teacher-subject assignment endpoint
      const response = await api.post('/api/teacher-subject-assignment', {
        teacherId: selectedTeacher,
        subjectIds: selectedSubjects,
        classId: selectedClass
      });

      setSuccess('Subjects assigned to teacher successfully!');
      fetchTeacherSubjects();
      fetchTeacherClasses();
    } catch (error) {
      console.error('Error assigning subjects:', error);
      setError(`Failed to assign subjects: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear error message
  const handleCloseError = () => {
    setError('');
  };

  // Clear success message
  const handleCloseSuccess = () => {
    setSuccess('');
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Execute dialog action
  const handleDialogAction = () => {
    if (dialogContent.action) {
      dialogContent.action();
    } else {
      setOpenDialog(false);
    }
  };

  // Render the diagnostic result
  const renderDiagnosticResult = () => {
    if (!diagnosticResult) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Diagnostic Result
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                Teacher: {diagnosticResult.diagnostic?.teacher?.name || 'N/A'}
              </Typography>
              <Typography variant="subtitle1">
                Class: {diagnosticResult.diagnostic?.class?.name || 'N/A'} ({diagnosticResult.diagnostic?.class?.educationLevel || 'N/A'})
              </Typography>
              <Typography variant="subtitle1">
                Subject Count: {diagnosticResult.diagnostic?.class?.subjectCount || 0}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                Assignments in Class Model: {diagnosticResult.diagnostic?.assignments?.classModel || 0}
              </Typography>
              <Typography variant="subtitle1">
                TeacherSubject Assignments: {diagnosticResult.diagnostic?.assignments?.teacherSubject || 0}
              </Typography>
              <Typography variant="subtitle1">
                TeacherAssignment Assignments: {diagnosticResult.diagnostic?.assignments?.teacherAssignment || 0}
              </Typography>
            </Grid>
          </Grid>
          
          {diagnosticResult.diagnostic?.issues && diagnosticResult.diagnostic.issues.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Issues Found:
              </Typography>
              <List>
                {diagnosticResult.diagnostic.issues.map((issue, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={issue.subject}
                      secondary={`${issue.issue} (${issue.type})`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        icon={<Error />}
                        label="Fixed"
                        color="success"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
          
          {diagnosticResult.fixResult && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Fix Result: {diagnosticResult.fixResult.message}
              </Typography>
              {diagnosticResult.fixResult.details && (
                <Typography variant="body2">
                  Fixed {diagnosticResult.fixResult.details.assignments.classModel} class assignments, 
                  {diagnosticResult.fixResult.details.assignments.teacherSubject} teacher-subject assignments, and 
                  {diagnosticResult.fixResult.details.assignments.teacherAssignment} teacher-assignment records.
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Teacher Assignment Manager
        </Typography>
        <Typography variant="body1" paragraph>
          Use this tool to manage teacher-subject assignments and fix any issues with O-Level marks entry.
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab icon={<Assignment />} label="Fix Assignments" />
          <Tab icon={<School />} label="Manage Assignments" />
          <Tab icon={<Info />} label="Diagnostics" />
        </Tabs>

        {/* Fix Assignments Tab */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Fix Teacher Assignments
            </Typography>
            <Typography variant="body2" paragraph>
              This tool will assign a teacher to all subjects in a class, fixing any issues with O-Level marks entry.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                    label="Teacher"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a teacher</em>
                    </MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a class</em>
                    </MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} {cls.section} ({cls.educationLevel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFixAssignments}
                  disabled={loading || !selectedTeacher || !selectedClass}
                  startIcon={loading ? <CircularProgress size={20} /> : <Check />}
                  fullWidth
                >
                  {loading ? 'Processing...' : 'Fix Teacher Assignments'}
                </Button>
              </Grid>

              {selectedTeacher && selectedClass && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={fetchTeacherSubjects}
                    disabled={loading}
                    startIcon={<Refresh />}
                  >
                    Check Current Assignments
                  </Button>
                </Grid>
              )}
            </Grid>

            {teacherSubjects.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Current Subject Assignments
                </Typography>
                <List>
                  {teacherSubjects.map((subject) => (
                    <ListItem key={subject._id}>
                      <ListItemText
                        primary={subject.name}
                        secondary={`${subject.code} (${subject.educationLevel})`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          icon={<Check />}
                          label={subject.assignmentType}
                          color="primary"
                          variant="outlined"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {renderDiagnosticResult()}
          </Box>
        )}

        {/* Manage Assignments Tab */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Manage Teacher-Subject Assignments
            </Typography>
            <Typography variant="body2" paragraph>
              Assign specific subjects to teachers in a class.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                    label="Teacher"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a teacher</em>
                    </MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a class</em>
                    </MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} {cls.section} ({cls.educationLevel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedClass && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Subjects</InputLabel>
                    <Select
                      multiple
                      value={selectedSubjects}
                      onChange={handleSubjectChange}
                      label="Subjects"
                      disabled={loading}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const subject = subjects.find(s => s._id === value);
                            return (
                              <Chip 
                                key={value} 
                                label={subject ? subject.name : value} 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAssignSelectedSubjects}
                  disabled={loading || !selectedTeacher || !selectedClass || selectedSubjects.length === 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <Assignment />}
                  fullWidth
                >
                  {loading ? 'Processing...' : 'Assign Selected Subjects'}
                </Button>
              </Grid>

              {selectedTeacher && (
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={fetchTeacherClasses}
                    disabled={loading}
                    startIcon={<Refresh />}
                  >
                    View Teacher's Classes
                  </Button>
                </Grid>
              )}
            </Grid>

            {teacherClasses.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Teacher's Classes
                </Typography>
                <List>
                  {teacherClasses.map((cls) => (
                    <ListItem key={cls._id}>
                      <ListItemText
                        primary={`${cls.name} ${cls.section}`}
                        secondary={`${cls.educationLevel} - ${cls.academicYear}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedClass(cls._id);
                            fetchSubjectsForClass(cls._id);
                            fetchTeacherSubjects();
                          }}
                        >
                          View Subjects
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {teacherSubjects.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Current Subject Assignments
                </Typography>
                <List>
                  {teacherSubjects.map((subject) => (
                    <ListItem key={subject._id}>
                      <ListItemText
                        primary={subject.name}
                        secondary={`${subject.code} (${subject.educationLevel})`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          icon={<Check />}
                          label={subject.assignmentType}
                          color="primary"
                          variant="outlined"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Diagnostics Tab */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Diagnose Teacher Assignments
            </Typography>
            <Typography variant="body2" paragraph>
              This tool will diagnose and fix any issues with teacher assignments for a specific class.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                    label="Teacher"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a teacher</em>
                    </MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    label="Class"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Select a class</em>
                    </MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} {cls.section} ({cls.educationLevel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDiagnoseAssignments}
                  disabled={loading || !selectedTeacher || !selectedClass}
                  startIcon={loading ? <CircularProgress size={20} /> : <Info />}
                  fullWidth
                >
                  {loading ? 'Processing...' : 'Diagnose and Fix Assignments'}
                </Button>
              </Grid>
            </Grid>

            {renderDiagnosticResult()}
          </Box>
        )}
      </Paper>

      {/* Snackbars for success and error messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{dialogContent.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogContent.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDialogAction} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherAssignmentManager;
