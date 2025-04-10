import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from '../../services/api';

const SubjectClassAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState({});

  // Create a loadData function using useCallback
  const createLoadDataFunction = useCallback(() => {
    return async () => {
      setLoading(true);
      try {
        console.log('Fetching data for Subject-Class Assignment...');

        // Fetch academic years first
        console.log('Fetching academic years...');
        const academicYearsRes = await api.get('/api/academic-years');
        console.log('Academic years response:', academicYearsRes.data);
        setAcademicYears(academicYearsRes.data);

        // Fetch other data
        console.log('Fetching classes, subjects, and teachers...');
        const [classesRes, subjectsRes, teachersRes] = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/subjects'),
          api.get('/api/teachers')
        ]);

        console.log('Classes response:', classesRes.data);
        console.log('Subjects response:', subjectsRes.data);
        console.log('Teachers response:', teachersRes.data);

        setClasses(classesRes.data);
        setSubjects(subjectsRes.data);
        setTeachers(teachersRes.data);

        // If there are academic years, select the first one by default
        if (academicYearsRes.data && academicYearsRes.data.length > 0) {
          console.log('Setting default academic year:', academicYearsRes.data[0]);
          setSelectedAcademicYear(academicYearsRes.data[0]._id);

          // Filter classes by the selected academic year
          const filtered = classesRes.data.filter(
            cls => cls.academicYear === academicYearsRes.data[0]._id
          );
          console.log('Filtered classes for academic year:', filtered);
          setFilteredClasses(filtered);
        } else {
          console.warn('No academic years found or academic years array is empty');
        }

        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        let errorMessage = 'Failed to fetch data';

        if (err.response) {
          console.error('Error response:', err.response);
          errorMessage += `: ${err.response.data?.message || err.response.statusText || err.message}`;
        } else if (err.request) {
          console.error('Error request:', err.request);
          errorMessage += ': No response received from server. Please check your network connection.';
        } else {
          console.error('Error message:', err.message);
          errorMessage += `: ${err.message}`;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  }, []);

  // Load data when component mounts
  useEffect(() => {
    const loadData = createLoadDataFunction();
    loadData();
  }, [createLoadDataFunction]);

  // Filter classes when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      const filtered = classes.filter(
        cls => cls.academicYear === selectedAcademicYear
      );
      setFilteredClasses(filtered);

      // Reset selected class if it's not in the filtered list
      if (selectedClass && !filtered.some(cls => cls._id === selectedClass)) {
        setSelectedClass('');
      }
    } else {
      setFilteredClasses([]);
      setSelectedClass('');
    }
  }, [selectedAcademicYear, classes, selectedClass]);

  // Load class subjects when a class is selected
  useEffect(() => {
    if (selectedClass) {
      const loadClassSubjects = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/classes/${selectedClass}`);
          const classData = response.data;

          // Initialize selected subjects from class data
          const classSubjects = classData.subjects || [];
          setSelectedSubjects(classSubjects.map(s => s.subject));

          // Initialize subject-teacher mapping
          const teacherMap = {};

          // Use for...of instead of forEach
          for (const s of classSubjects) {
            if (s.subject && s.teacher) {
              teacherMap[s.subject] = s.teacher;
            }
          }
          setSubjectTeachers(teacherMap);

        } catch (err) {
          console.error('Error loading class subjects:', err);
          setError(`Failed to load class subjects: ${err.response?.data?.message || err.message}`);
        } finally {
          setLoading(false);
        }
      };

      loadClassSubjects();
    } else {
      setSelectedSubjects([]);
      setSubjectTeachers({});
    }
  }, [selectedClass]);

  const handleAcademicYearChange = (e) => {
    setSelectedAcademicYear(e.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubjectToggle = (subjectId) => {
    const currentIndex = selectedSubjects.indexOf(subjectId);
    const newSelectedSubjects = [...selectedSubjects];

    if (currentIndex === -1) {
      // Add the subject
      newSelectedSubjects.push(subjectId);
    } else {
      // Remove the subject
      newSelectedSubjects.splice(currentIndex, 1);

      // Also remove the teacher assignment
      const newSubjectTeachers = { ...subjectTeachers };
      delete newSubjectTeachers[subjectId];
      setSubjectTeachers(newSubjectTeachers);
    }

    setSelectedSubjects(newSelectedSubjects);
  };

  const handleTeacherChange = (subjectId, teacherId) => {
    setSubjectTeachers({
      ...subjectTeachers,
      [subjectId]: teacherId
    });
  };

  const handleSaveAssignments = async () => {
    if (!selectedClass) {
      setError('Please select a class first');
      return;
    }

    setLoading(true);
    try {
      // Format the subjects array with subject and teacher IDs
      const subjectsArray = selectedSubjects.map(subjectId => ({
        subject: subjectId,
        teacher: subjectTeachers[subjectId] || null
      }));

      // Update the class with the new subjects array
      await api.put(`/api/classes/${selectedClass}/subjects`, {
        subjects: subjectsArray
      });

      setSuccess('Subject assignments saved successfully');

      // Reload the class data
      const loadData = createLoadDataFunction();
      loadData();

    } catch (err) {
      console.error('Error saving subject assignments:', err);
      setError(`Failed to save subject assignments: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
      handleCloseDialog();
    }
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned';
  };

  // Get class name by ID
  const getClassName = (classId) => {
    const classObj = classes.find(c => c._id === classId);
    return classObj ? classObj.name : 'Unknown Class';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Subject-Class Assignment
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Assign subjects to classes and specify which teacher teaches each subject.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Select Academic Year and Class</Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              component="a"
              href="/admin/academic-years"
            >
              Manage Academic Years
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              component="a"
              href="/admin/classes"
            >
              Manage Classes
            </Button>
          </Box>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="academic-year-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-label"
                id="academic-year-select"
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={handleAcademicYearChange}
                disabled={loading}
              >
                {academicYears.length > 0 ? (
                  academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No academic years available
                  </MenuItem>
                )}
              </Select>
              {academicYears.length === 0 && !loading && (
                <FormHelperText error>
                  No academic years found. Please create an academic year first.
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="class-label">Class</InputLabel>
              <Select
                labelId="class-label"
                id="class-select"
                value={selectedClass}
                label="Class"
                onChange={handleClassChange}
                disabled={loading || filteredClasses.length === 0}
              >
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} - {cls.stream || ''} {cls.section ? `(${cls.section})` : ''}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No classes available for selected academic year
                  </MenuItem>
                )}
              </Select>
              {filteredClasses.length === 0 && selectedAcademicYear && !loading && (
                <FormHelperText error>
                  No classes found for this academic year. Please create classes first.
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {selectedClass && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Subjects for {getClassName(selectedClass)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleOpenDialog}
              disabled={loading}
            >
              Edit Subject Assignments
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedSubjects.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSubjects.map((subjectId) => (
                    <TableRow key={subjectId}>
                      <TableCell>{getSubjectName(subjectId)}</TableCell>
                      <TableCell>
                        {subjectTeachers[subjectId] ? (
                          getTeacherName(subjectTeachers[subjectId])
                        ) : (
                          <Typography color="error">No teacher assigned</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
              No subjects assigned to this class yet. Click "Edit Subject Assignments" to add subjects.
            </Typography>
          )}
        </Paper>
      )}

      {/* Subject Assignment Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Subject Assignments</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Available Subjects
              </Typography>
              {subjects.length > 0 ? (
                <List>
                  {subjects.map((subject) => (
                  <ListItem key={subject._id} dense button onClick={() => handleSubjectToggle(subject._id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedSubjects.indexOf(subject._id) !== -1}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={subject.name}
                      secondary={`Code: ${subject.code} | Type: ${subject.type}`}
                    />
                  </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No subjects found. Please create subjects first.
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Assign Teachers
              </Typography>
              {teachers.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No teachers found. Please create teacher profiles first.
                </Alert>
              ) : selectedSubjects.length > 0 ? (
                <List>
                  {selectedSubjects.map((subjectId) => (
                    <ListItem key={subjectId} dense>
                      <ListItemText
                        primary={getSubjectName(subjectId)}
                      />
                      <FormControl fullWidth sx={{ ml: 2, minWidth: 150 }}>
                        <InputLabel id={`teacher-label-${subjectId}`}>Teacher</InputLabel>
                        <Select
                          labelId={`teacher-label-${subjectId}`}
                          id={`teacher-select-${subjectId}`}
                          value={subjectTeachers[subjectId] || ''}
                          label="Teacher"
                          onChange={(e) => handleTeacherChange(subjectId, e.target.value)}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {teachers.map((teacher) => (
                            <MenuItem key={teacher._id} value={teacher._id}>
                              {teacher.firstName} {teacher.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select subjects from the list to assign teachers.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveAssignments}
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Assignments'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubjectClassAssignment;
