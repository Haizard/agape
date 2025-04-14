import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon
} from '@mui/icons-material';
import unifiedApi from '../../../services/unifiedApi';

/**
 * AssignmentSetup Component
 *
 * A comprehensive component for assigning subjects to classes, teachers to subjects,
 * and subjects to students. This component replaces separate assignment forms with a unified approach.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Function to call when setup is complete
 * @param {boolean} props.standalone - Whether the component is used standalone or as part of a workflow
 */
const AssignmentSetup = ({ onComplete, standalone = false }) => {
  // State for tabs
  const [activeTab, setActiveTab] = useState(0);

  // State for data
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [combinations, setCombinations] = useState([]);

  // State for selections
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCombination, setSelectedCombination] = useState('');

  // State for assignments
  const [classSubjects, setClassSubjects] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [selectionType, setSelectionType] = useState('');

  // Fetch initial data on component mount
  useEffect(() => {
    fetchAcademicYears();
    fetchTeachers();
    fetchSubjectCombinations();
  }, []);

  // Fetch classes when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchClasses(selectedAcademicYear);
    }
  }, [selectedAcademicYear]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
      fetchClassSubjects();
    }
  }, [selectedClass]);

  // Fetch teacher subjects when teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherSubjects();
    }
  }, [selectedTeacher]);

  // Fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  // Fetch student subjects when student changes
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentSubjects();
    }
  }, [selectedStudent]);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.getAcademicYears();
      setAcademicYears(response);

      // Set default academic year to current
      const currentYear = response.find(year => year.isCurrent);
      if (currentYear) {
        setSelectedAcademicYear(currentYear._id);
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async (academicYearId) => {
    try {
      setLoading(true);

      const response = await unifiedApi.getClassesByAcademicYear(academicYearId);
      setClasses(response);

      // Reset selected class
      setSelectedClass('');
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);

      // Get selected class to determine education level
      const classObj = classes.find(cls => cls._id === selectedClass);
      if (!classObj) {
        setLoading(false);
        return;
      }

      // Fetch subjects for the education level
      const response = await unifiedApi.get(`/subjects?educationLevel=${classObj.educationLevel}`);
      setSubjects(response);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.get('/teachers');
      setTeachers(response);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.getStudentsByClass(selectedClass);
      setStudents(response);

      // Reset selected student
      setSelectedStudent('');
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subject combinations
  const fetchSubjectCombinations = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.get('/subject-combinations');
      setCombinations(response);
    } catch (err) {
      console.error('Error fetching subject combinations:', err);
      setError('Failed to load subject combinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch class subjects
  const fetchClassSubjects = async () => {
    try {
      setLoading(true);

      const response = await unifiedApi.get(`/classes/${selectedClass}/subjects`);
      setClassSubjects(response.map(subject => subject._id));
    } catch (err) {
      console.error('Error fetching class subjects:', err);
      setError('Failed to load class subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher subjects
  const fetchTeacherSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching teacher subjects for teacher:', selectedTeacher);
      const response = await unifiedApi.get(`/teachers/${selectedTeacher}/subjects`);
      console.log('Teacher subjects response:', response);

      // Check if response is valid
      if (!response) {
        console.error('Invalid response: response is undefined');
        setTeacherSubjects([]);
        setError('Failed to load teacher subjects. Invalid response from server.');
        return;
      }

      // Check if response is an array
      if (!Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setTeacherSubjects([]);
        setError('Failed to load teacher subjects. Invalid response format.');
        return;
      }

      setTeacherSubjects(response.map(subject => typeof subject === 'object' ? subject._id : subject));
    } catch (err) {
      console.error('Error fetching teacher subjects:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setTeacherSubjects([]);
      setError('Failed to load teacher subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student subjects
  const fetchStudentSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching student subjects for student:', selectedStudent);
      const response = await unifiedApi.get(`/students/${selectedStudent}/subjects`);
      console.log('Student subjects response:', response);

      // Check if response is valid
      if (!response) {
        console.error('Invalid response: response is undefined');
        setStudentSubjects([]);
        setError('Failed to load student subjects. Invalid response from server.');
        return;
      }

      // Check if response is an array
      if (!Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setStudentSubjects([]);
        setError('Failed to load student subjects. Invalid response format.');
        return;
      }

      setStudentSubjects(response.map(subject => typeof subject === 'object' ? subject._id : subject));
    } catch (err) {
      console.error('Error fetching student subjects:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setStudentSubjects([]);
      setError('Failed to load student subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle academic year change
  const handleAcademicYearChange = (e) => {
    setSelectedAcademicYear(e.target.value);
  };

  // Handle class change
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  // Handle teacher change
  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
  };

  // Handle student change
  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
  };

  // Handle combination change
  const handleCombinationChange = (e) => {
    setSelectedCombination(e.target.value);
  };

  // Open selection dialog
  const handleOpenSelectionDialog = (type) => {
    setSelectionType(type);
    setSelectionDialogOpen(true);
  };

  // Close selection dialog
  const handleCloseSelectionDialog = () => {
    setSelectionDialogOpen(false);
  };

  // Handle subject selection for class
  const handleClassSubjectSelection = (subjectId) => {
    setClassSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Handle subject selection for teacher
  const handleTeacherSubjectSelection = (subjectId) => {
    setTeacherSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Handle subject selection for student
  const handleStudentSubjectSelection = (subjectId) => {
    setStudentSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Save class subjects
  const saveClassSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      await unifiedApi.post(`/classes/${selectedClass}/subjects`, { subjects: classSubjects });

      setSuccess('Class subjects saved successfully.');

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving class subjects:', err);
      setError(`Failed to save class subjects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save teacher subjects
  const saveTeacherSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      await unifiedApi.post(`/teachers/${selectedTeacher}/subjects`, { subjects: teacherSubjects });

      setSuccess('Teacher subjects saved successfully.');

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving teacher subjects:', err);
      setError(`Failed to save teacher subjects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save student subjects
  const saveStudentSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      await unifiedApi.post(`/students/${selectedStudent}/subjects`, { subjects: studentSubjects });

      setSuccess('Student subjects saved successfully.');

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving student subjects:', err);
      setError(`Failed to save student subjects: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assign combination to student
  const assignCombinationToStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!selectedStudent || !selectedCombination) {
        setError('Please select a student and a subject combination.');
        setLoading(false);
        return;
      }

      console.log(`Assigning combination ${selectedCombination} to student ${selectedStudent}`);

      // Get the combination
      const combination = combinations.find(c => c._id === selectedCombination);
      if (!combination) {
        setError('Selected combination not found.');
        setLoading(false);
        return;
      }

      console.log('Found combination:', combination);

      // Get all subjects from the combination
      const combinationSubjects = [];

      // Add principal subjects (now called 'subjects' in the backend)
      if (combination.subjects && Array.isArray(combination.subjects)) {
        const principalSubjects = combination.subjects.map(s => {
          const subjectId = typeof s === 'object' ? s._id : s;
          console.log(`Adding principal subject: ${subjectId}`);
          return subjectId;
        });
        combinationSubjects.push(...principalSubjects);
      } else {
        console.warn('No principal subjects found in combination or invalid format');
      }

      // Add subsidiary subjects (now called 'compulsorySubjects' in the backend)
      if (combination.compulsorySubjects && Array.isArray(combination.compulsorySubjects)) {
        const subsidiarySubjects = combination.compulsorySubjects.map(s => {
          const subjectId = typeof s === 'object' ? s._id : s;
          console.log(`Adding subsidiary subject: ${subjectId}`);
          return subjectId;
        });
        combinationSubjects.push(...subsidiarySubjects);
      } else {
        console.warn('No subsidiary subjects found in combination or invalid format');
      }

      console.log('Combination subjects to assign:', combinationSubjects);

      if (combinationSubjects.length === 0) {
        setError('No valid subjects found in the selected combination.');
        setLoading(false);
        return;
      }

      // Assign subjects to student
      try {
        console.log(`Sending POST request to /students/${selectedStudent}/subjects`);
        const subjectsResponse = await unifiedApi.post(`/students/${selectedStudent}/subjects`, {
          subjects: combinationSubjects
        });
        console.log('Subjects assignment response:', subjectsResponse);
      } catch (subjectError) {
        console.error('Error assigning subjects to student:', subjectError);
        // Continue with education level update even if subject assignment fails
      }

      // Update student education level to A-Level
      try {
        console.log(`Updating student education level to A_LEVEL`);
        await unifiedApi.updateStudentEducationLevel(selectedStudent, 'A_LEVEL');
      } catch (levelError) {
        console.error('Error updating student education level:', levelError);
        // Continue even if education level update fails
      }

      setSuccess('Subject combination assigned to student successfully.');

      // Refresh student subjects
      await fetchStudentSubjects();

      // Mark step as complete if not standalone
      if (!standalone) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error assigning combination to student:', err);
      setError(`Failed to assign combination to student: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    if (!subjectId) {
      console.warn('getSubjectName called with null or undefined subjectId');
      return 'Unknown Subject';
    }

    if (!subjects || !Array.isArray(subjects)) {
      console.warn('getSubjectName called with invalid subjects array:', subjects);
      return 'Unknown Subject';
    }

    const subject = subjects.find(s => s && s._id === subjectId);
    return subject && subject.name ? subject.name : 'Unknown Subject';
  };

  return (
    <Box>
      {standalone && (
        <Typography variant="h5" gutterBottom>
          Assignment Management
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Academic Year Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Academic Year
        </Typography>

        <FormControl fullWidth>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={selectedAcademicYear}
            onChange={handleAcademicYearChange}
            label="Academic Year"
          >
            {academicYears.map((year) => (
              <MenuItem key={year._id} value={year._id}>
                {year.name} {year.isCurrent && '(Current)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Class Subjects" icon={<SchoolIcon />} />
          <Tab label="Teacher Subjects" icon={<PersonIcon />} />
          <Tab label="Student Subjects" icon={<BookIcon />} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Class Subjects Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Assign Subjects to Class
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!selectedAcademicYear}>
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClass}
                      onChange={handleClassChange}
                      label="Class"
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ''}
                          <Chip
                            label={cls.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                            color={cls.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedClass && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Subjects ({classSubjects.length})
                      </Typography>

                      <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                        {classSubjects.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No subjects assigned to this class
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {classSubjects.map(subjectId => (
                              <Chip
                                key={subjectId}
                                label={getSubjectName(subjectId)}
                                onDelete={() => handleClassSubjectSelection(subjectId)}
                                color="primary"
                              />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenSelectionDialog('class')}
                          disabled={!selectedClass}
                        >
                          Select Subjects
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={saveClassSubjects}
                          disabled={!selectedClass || loading}
                        >
                          Save Class Subjects
                        </Button>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}

          {/* Teacher Subjects Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Assign Subjects to Teacher
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Teacher</InputLabel>
                    <Select
                      value={selectedTeacher}
                      onChange={handleTeacherChange}
                      label="Teacher"
                    >
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher._id} value={teacher._id}>
                          {teacher.firstName} {teacher.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedTeacher && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Subjects ({teacherSubjects.length})
                      </Typography>

                      <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                        {teacherSubjects.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No subjects assigned to this teacher
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {teacherSubjects.map(subjectId => (
                              <Chip
                                key={subjectId}
                                label={getSubjectName(subjectId)}
                                onDelete={() => handleTeacherSubjectSelection(subjectId)}
                                color="primary"
                              />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenSelectionDialog('teacher')}
                          disabled={!selectedTeacher}
                        >
                          Select Subjects
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={saveTeacherSubjects}
                          disabled={!selectedTeacher || loading}
                        >
                          Save Teacher Subjects
                        </Button>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}

          {/* Student Subjects Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Assign Subjects to Student
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedAcademicYear}>
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClass}
                      onChange={handleClassChange}
                      label="Class"
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ''}
                          <Chip
                            label={cls.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                            color={cls.educationLevel === 'O_LEVEL' ? 'primary' : 'secondary'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedClass}>
                    <InputLabel>Student</InputLabel>
                    <Select
                      value={selectedStudent}
                      onChange={handleStudentChange}
                      label="Student"
                    >
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedStudent && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Individual Subject Selection
                      </Typography>

                      <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                        {studentSubjects.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No subjects assigned to this student
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {studentSubjects.map(subjectId => (
                              <Chip
                                key={subjectId}
                                label={getSubjectName(subjectId)}
                                onDelete={() => handleStudentSubjectSelection(subjectId)}
                                color="primary"
                              />
                            ))}
                          </Box>
                        )}
                      </Paper>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenSelectionDialog('student')}
                          disabled={!selectedStudent}
                        >
                          Select Individual Subjects
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={saveStudentSubjects}
                          disabled={!selectedStudent || loading}
                        >
                          Save Student Subjects
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        A-Level Subject Combination Assignment
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Subject Combination</InputLabel>
                        <Select
                          value={selectedCombination}
                          onChange={handleCombinationChange}
                          label="Subject Combination"
                        >
                          {combinations.map((combination) => (
                            <MenuItem key={combination._id} value={combination._id}>
                              {combination.name} ({combination.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={assignCombinationToStudent}
                        disabled={!selectedStudent || !selectedCombination || loading}
                      >
                        Assign Combination to Student
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Subject Selection Dialog */}
      <Dialog
        open={selectionDialogOpen}
        onClose={handleCloseSelectionDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectionType === 'class' ? 'Select Subjects for Class' :
           selectionType === 'teacher' ? 'Select Subjects for Teacher' :
           'Select Subjects for Student'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : subjects.length === 0 ? (
            <Alert severity="warning">
              No subjects found. Please create subjects first.
            </Alert>
          ) : (
            <List>
              {subjects.map(subject => (
                <ListItem
                  key={subject._id}
                  button
                  onClick={() => {
                    if (selectionType === 'class') {
                      handleClassSubjectSelection(subject._id);
                    } else if (selectionType === 'teacher') {
                      handleTeacherSubjectSelection(subject._id);
                    } else {
                      handleStudentSubjectSelection(subject._id);
                    }
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={
                        selectionType === 'class' ? classSubjects.includes(subject._id) :
                        selectionType === 'teacher' ? teacherSubjects.includes(subject._id) :
                        studentSubjects.includes(subject._id)
                      }
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={subject.name}
                    secondary={
                      <>
                        {subject.code}
                        {subject.isCompulsory && (
                          <Chip
                            label="Compulsory"
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {subject.isPrincipal && (
                          <Chip
                            label="Principal"
                            color="info"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSelectionDialog} color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

AssignmentSetup.propTypes = {
  onComplete: PropTypes.func,
  standalone: PropTypes.bool
};

export default AssignmentSetup;
