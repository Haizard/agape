import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';
import teacherAuthService from '../../services/teacherAuthService';
import PreviewDialog from './PreviewDialog';
import { aLevelGradeCalculator } from '../../utils/gradeCalculator';

// This is a simplified version of the A-Level Bulk Marks Entry component
// It uses a direct approach to fetch subjects and filter them for teachers

const SimplifiedALevelBulkMarksEntry = () => {
  const navigate = useNavigate();

  // State variables
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Calculate grade and points using the A-Level grade calculator
  const calculateGrade = (marks) => aLevelGradeCalculator.calculateGrade(marks);
  const calculatePoints = (grade) => aLevelGradeCalculator.calculatePoints(grade);

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/classes');

        // Filter for A-Level classes
        const aLevelClasses = response.data.filter(cls =>
          cls.form === 5 ||
          cls.form === 6 ||
          cls.educationLevel === 'A_LEVEL' ||
          (cls.name && (
            cls.name.toUpperCase().includes('FORM 5') ||
            cls.name.toUpperCase().includes('FORM 6') ||
            cls.name.toUpperCase().includes('FORM V') ||
            cls.name.toUpperCase().includes('FORM VI') ||
            cls.name.toUpperCase().includes('A-LEVEL') ||
            cls.name.toUpperCase().includes('A LEVEL')
          ))
        );

        console.log(`Found ${aLevelClasses.length} A-Level classes`);
        setClasses(aLevelClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/exams');
        setExams(response.data || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to fetch exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);
        setError(null); // Clear any previous errors

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();
        console.log(`User is ${isAdmin ? 'an admin' : 'a teacher'}`);

        // Get all A-Level subjects first
        console.log('Fetching all A-Level subjects');
        const aLevelResponse = await api.get('/api/subjects/a-level');

        if (!aLevelResponse.data || !Array.isArray(aLevelResponse.data) || aLevelResponse.data.length === 0) {
          throw new Error('No A-Level subjects found');
        }

        console.log(`Found ${aLevelResponse.data.length} A-Level subjects`);

        // If admin, show all subjects
        if (isAdmin) {
          console.log('Admin user: showing all A-Level subjects');
          setSubjects(aLevelResponse.data);
        } else {
          // For teachers, filter to only show subjects they teach
          console.log('Teacher user: filtering subjects to only show assigned subjects');

          // Get teacher's assigned subjects
          let teacherSubjects = [];
          let teacherSubjectsFound = false;

          // Try to get teacher's assigned subjects
          try {
            console.log(`Fetching subjects that the teacher is assigned to teach in class ${selectedClass}`);
            const response = await api.get(`/api/teachers/classes/${selectedClass}/subjects`);

            if (response.data) {
              if (Array.isArray(response.data)) {
                teacherSubjects = response.data;
                teacherSubjectsFound = true;
              } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
                teacherSubjects = response.data.subjects;
                teacherSubjectsFound = true;
              }
            }

            console.log(`Found ${teacherSubjects.length} subjects assigned to teacher`);
          } catch (error) {
            console.error('Error fetching teacher subjects:', error);
            // Continue with fallback
          }

          // If no teacher subjects found, try another endpoint
          if (!teacherSubjectsFound || teacherSubjects.length === 0) {
            try {
              console.log('Trying alternative endpoint for teacher subjects');
              const response = await api.get('/api/teachers/marks-entry-subjects', {
                params: { classId: selectedClass }
              });

              if (response.data) {
                if (Array.isArray(response.data)) {
                  teacherSubjects = response.data;
                  teacherSubjectsFound = true;
                } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
                  teacherSubjects = response.data.subjects;
                  teacherSubjectsFound = true;
                }
              }

              console.log(`Found ${teacherSubjects.length} subjects from alternative endpoint`);
            } catch (error) {
              console.error('Error fetching teacher subjects from alternative endpoint:', error);
            }
          }

          // If we found teacher subjects, filter the A-Level subjects
          if (teacherSubjectsFound && teacherSubjects.length > 0) {
            // Extract subject IDs from teacher subjects
            const teacherSubjectIds = teacherSubjects.map(s => s._id);
            console.log('Teacher subject IDs:', teacherSubjectIds);

            // Filter A-Level subjects to only include those the teacher teaches
            const filteredSubjects = aLevelResponse.data.filter(subject =>
              teacherSubjectIds.includes(subject._id)
            );

            console.log(`Filtered to ${filteredSubjects.length} A-Level subjects that the teacher teaches`);

            if (filteredSubjects.length > 0) {
              setSubjects(filteredSubjects);
            } else {
              // If no matching subjects, show all A-Level subjects
              console.log('No matching subjects found, showing all A-Level subjects');
              setSubjects(aLevelResponse.data);
            }
          } else {
            // If no teacher subjects found, show all A-Level subjects
            console.log('No teacher subjects found, showing all A-Level subjects');
            setSubjects(aLevelResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch subjects. Please try again.');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // Fetch students when class, subject, and exam are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject || !selectedExam) return;

      try {
        setLoading(true);

        // Get students in the class
        const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
        const studentsData = studentsResponse.data || [];

        console.log(`Found ${studentsData.length} students for class ${selectedClass}`);

        // Check if there are existing marks for these students
        // Use the correct endpoint for A-Level results
        const existingMarksResponse = await api.get(`/api/a-level-results/class/${selectedClass}/${selectedExam}`);

        // Filter results for the selected subject
        const existingMarks = existingMarksResponse.data ?
          existingMarksResponse.data.filter(result => result.subjectId === selectedSubject) :
          [];
        console.log(`Found ${existingMarks.length} existing marks`);

        // Create marks array with existing marks or empty marks
        const marksData = studentsData.map(student => {
          // Find existing mark for this student
          const existingMark = existingMarks.find(mark =>
            mark.studentId === student._id
          );

          if (existingMark) {
            return {
              _id: existingMark._id,
              studentId: student._id,
              studentName: `${student.firstName} ${student.middleName || ''} ${student.lastName}`,
              examId: selectedExam,
              subjectId: selectedSubject,
              classId: selectedClass,
              marksObtained: existingMark.marksObtained,
              grade: existingMark.grade,
              points: existingMark.points,
              comment: existingMark.comment || '',
              isPrincipal: existingMark.isPrincipal || false,
              isInCombination: true // Assume all students take this subject
            };
          } else {
            return {
              studentId: student._id,
              studentName: `${student.firstName} ${student.middleName || ''} ${student.lastName}`,
              examId: selectedExam,
              subjectId: selectedSubject,
              classId: selectedClass,
              marksObtained: '',
              grade: '',
              points: '',
              comment: '',
              isPrincipal: false,
              isInCombination: true // Assume all students take this subject
            };
          }
        });

        setMarks(marksData);
      } catch (error) {
        console.error('Error fetching students and marks:', error);
        setError('Failed to fetch students and marks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, selectedExam]);

  // Handle input change for marks
  const handleMarksChange = (studentId, value) => {
    setMarks(prevMarks => {
      return prevMarks.map(mark => {
        if (mark.studentId === studentId) {
          // Calculate grade and points if marks are entered
          const numericValue = value === '' ? '' : Number(value);
          const grade = numericValue === '' ? '' : calculateGrade(numericValue);
          const points = grade === '' ? '' : calculatePoints(grade);

          return {
            ...mark,
            marksObtained: value,
            grade,
            points
          };
        }
        return mark;
      });
    });
  };

  // Handle class change
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedSubject('');
    setSelectedExam('');
    setMarks([]);
  };

  // Handle subject change
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    setMarks([]);
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
    setMarks([]);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle preview open
  const handlePreviewOpen = () => {
    // Filter marks that have values
    const marksWithValues = marks.filter(mark => mark.marksObtained);

    if (marksWithValues.length === 0) {
      setSnackbar({
        open: true,
        message: 'No marks to save',
        severity: 'warning'
      });
      return;
    }

    setPreviewData({
      marks: marksWithValues,
      class: classes.find(cls => cls._id === selectedClass)?.name || 'Unknown Class',
      subject: subjects.find(sub => sub._id === selectedSubject)?.name || 'Unknown Subject',
      exam: exams.find(exam => exam._id === selectedExam)?.name || 'Unknown Exam'
    });

    setPreviewOpen(true);
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    try {
      setLoading(true);

      if (!previewData || !previewData.marks || previewData.marks.length === 0) {
        throw new Error('No marks to save');
      }

      // Save marks
      console.log(`Saving ${previewData.marks.length} marks to the server`);
      const saveResponse = await api.post('/api/a-level-results/batch', previewData.marks);
      console.log('Save response:', saveResponse.data);

      // Log the structure of the saved marks
      if (saveResponse.data.results && Array.isArray(saveResponse.data.results)) {
        console.log('First saved mark structure:', saveResponse.data.results[0]);
      }

      if (saveResponse.data.errors && saveResponse.data.errors.length > 0) {
        console.warn('Some marks had errors during save:', saveResponse.data.errors);
      }

      // Update marks with saved IDs
      if (saveResponse.data.results && Array.isArray(saveResponse.data.results)) {
        console.log(`Received ${saveResponse.data.results.length} saved marks with IDs`);

        // Update the marks state with the saved marks
        setMarks(prevMarks => {
          const updatedMarks = [...prevMarks];

          // For each saved mark, update the corresponding mark in the state
          for (const savedMark of saveResponse.data.results) {
            // Make sure the savedMark has the necessary properties
            if (!savedMark || !savedMark._id || !savedMark.studentId) {
              console.warn('Invalid saved mark:', savedMark);
              continue;
            }

            console.log(`Processing saved mark for student ${savedMark.studentId} with ID ${savedMark._id}`);

            const index = updatedMarks.findIndex(mark => mark.studentId === savedMark.studentId);
            if (index !== -1) {
              updatedMarks[index] = {
                ...updatedMarks[index],
                _id: savedMark._id,
                grade: savedMark.grade || updatedMarks[index].grade,
                points: savedMark.points || updatedMarks[index].points
              };
              console.log(`Updated mark for student ${savedMark.studentId} with ID ${savedMark._id}`);
            }
          }

          return updatedMarks;
        });
      }

      // Close preview dialog
      setPreviewOpen(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error saving marks:', error);
      setError(`Failed to save marks: ${error.response?.data?.message || error.message}`);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      // Show loading indicator
      setLoading(true);

      // Reset marks and fetch data again
      setMarks([]);
      setActiveTab(0);

      // Trigger useEffect to fetch data
      const tempClass = selectedClass;
      const tempSubject = selectedSubject;
      const tempExam = selectedExam;

      setSelectedClass('');
      setSelectedSubject('');
      setSelectedExam('');

      setTimeout(() => {
        setSelectedClass(tempClass);
        setSelectedSubject(tempSubject);
        setSelectedExam(tempExam);
      }, 100);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Refreshing data...',
        severity: 'info'
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        A-Level Bulk Marks Entry (Simplified)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                label="Class"
                disabled={loading}
              >
                <MenuItem value="">Select Class</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedClass || loading}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={handleSubjectChange}
                label="Subject"
              >
                <MenuItem value="">Select Subject</MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedSubject || loading}>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={handleExamChange}
                label="Exam"
              >
                <MenuItem value="">Select Exam</MenuItem>
                {exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Enter Marks" />
              <Tab label="View Summary" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handlePreviewOpen}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Save All Marks
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Marks</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>History</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map(mark => (
                      <TableRow key={mark.studentId}>
                        <TableCell>{mark.studentName}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 1 }}
                            value={mark.marksObtained}
                            onChange={(e) => handleMarksChange(mark.studentId, e.target.value)}
                            size="small"
                            sx={{ width: '80px' }}
                          />
                        </TableCell>
                        <TableCell>{mark.grade}</TableCell>
                        <TableCell>{mark.points}</TableCell>
                        <TableCell>
                          {mark._id ? (
                            <Chip
                              icon={<CheckIcon />}
                              label="Saved"
                              color="success"
                              size="small"
                            />
                          ) : mark.marksObtained ? (
                            <Tooltip title="Click 'Save All Marks' to save changes">
                              <Chip
                                icon={<WarningIcon />}
                                label="Unsaved"
                                color="warning"
                                size="small"
                              />
                            </Tooltip>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {mark._id ? (
                            <Tooltip title="View mark history">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/marks-history/result/${mark._id}?model=ALevelResult`)}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Save marks to view history">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Grade</TableCell>
                      <TableCell>Count</TableCell>
                      <TableCell>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'S'].map(grade => {
                      const count = marks.filter(m => m.grade === grade).length;
                      const percentage = marks.length > 0 ? (count / marks.length * 100).toFixed(1) : 0;

                      return (
                        <TableRow key={grade}>
                          <TableCell>{grade}</TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          action={
            snackbar.severity === 'success' && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  handleSnackbarClose();
                  handleRefresh();
                }}
              >
                REFRESH
              </Button>
            )
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={loading}
      />
    </Box>
  );
};

export default SimplifiedALevelBulkMarksEntry;
