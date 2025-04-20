import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Save, Refresh, Info, Warning, CheckCircle } from '@mui/icons-material';
import enhancedTeacherService from '../../services/enhancedTeacherService';
import enhancedTeacherApiService from '../../services/enhancedTeacherApiService';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EnhancedBulkMarksEntry = () => {
  // State for selections
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const { user } = useAuth();

  // Fetch classes assigned to the teacher
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError('');

        // Try the direct API service first
        try {
          console.log('Fetching classes using enhanced API service');
          const assignedClasses = await enhancedTeacherApiService.getAssignedClasses();
          setClasses(assignedClasses);
        } catch (apiError) {
          console.log('Enhanced API service failed, falling back to regular service');
          // Fall back to the regular service
          const assignedClasses = await enhancedTeacherService.getAssignedClasses();
          setClasses(assignedClasses);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch assigned classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError('');

        // Check if the class is O-Level
        const classInfo = classes.find(c => c._id === selectedClass);
        const isOLevel = classInfo && (classInfo.educationLevel === 'O_LEVEL' || classInfo.educationLevel === 'O Level');

        let assignedSubjects;

        // Try the direct API service first
        try {
          if (isOLevel) {
            console.log('Fetching O-Level subjects using enhanced API service for class:', selectedClass);
            assignedSubjects = await enhancedTeacherApiService.getOLevelAssignedSubjects(selectedClass);
          } else {
            console.log('Fetching regular subjects using enhanced API service for class:', selectedClass);
            assignedSubjects = await enhancedTeacherApiService.getAssignedSubjects(selectedClass);
          }
        } catch (apiError) {
          console.log('Enhanced API service failed, falling back to regular service');
          // Fall back to the regular service
          if (isOLevel) {
            console.log('Fetching O-Level subjects using regular service for class:', selectedClass);
            assignedSubjects = await enhancedTeacherService.getOLevelAssignedSubjects(selectedClass);
          } else {
            console.log('Fetching regular subjects using regular service for class:', selectedClass);
            assignedSubjects = await enhancedTeacherService.getAssignedSubjects(selectedClass);
          }
        }

        console.log('Fetched subjects:', assignedSubjects);
        setSubjects(assignedSubjects);

        // If there's diagnostic information, store it
        if (assignedSubjects.diagnostic) {
          setDiagnosticResult(assignedSubjects.diagnostic);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch assigned subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, classes]);

  // Fetch exams when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setExams([]);
      return;
    }

    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/exams?class=${selectedClass}`);
        setExams(response.data);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to fetch exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedClass]);

  // Fetch students and existing marks when class, subject, and exam are selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      setStudents([]);
      setMarks([]);
      return;
    }

    const fetchStudentsAndMarks = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch students - try the enhanced API service first
        let studentsData;
        try {
          // Check if the class is O-Level
          const classInfo = classes.find(c => c._id === selectedClass);
          const isOLevel = classInfo && (classInfo.educationLevel === 'O_LEVEL' || classInfo.educationLevel === 'O Level');

          console.log(`Fetching students using enhanced API service for ${isOLevel ? 'O-Level' : 'A-Level'} class`);
          studentsData = await enhancedTeacherApiService.getStudentsForSubject(
            selectedClass,
            selectedSubject,
            isOLevel ? 'O_LEVEL' : 'A_LEVEL'
          );
        } catch (apiError) {
          console.log('Enhanced API service failed, falling back to regular service');
          // Fall back to the regular service
          try {
            // Check if the class is O-Level
            const classInfo = classes.find(c => c._id === selectedClass);
            const isOLevel = classInfo && (classInfo.educationLevel === 'O_LEVEL' || classInfo.educationLevel === 'O Level');

            console.log(`Falling back to regular service for ${isOLevel ? 'O-Level' : 'A-Level'} class`);
            studentsData = await enhancedTeacherService.getStudentsForSubject(
              selectedClass,
              selectedSubject,
              isOLevel ? 'O_LEVEL' : 'A_LEVEL'
            );
          } catch (serviceError) {
            console.log('Regular service failed, trying direct API call');
            // Try a direct API call as a last resort
            try {
              // First try our new direct endpoint
              console.log('Trying direct class-students endpoint');
              const response = await api.get(`/api/enhanced-teachers/class-students/${selectedClass}`);
              studentsData = response.data.students;
            } catch (directError) {
              console.log('Direct class-students endpoint failed, trying fallback');
              // Fall back to the students API
              const response = await api.get(`/api/students/class/${selectedClass}`);
              studentsData = response.data;
            }
          }
        }

        // If we still don't have students data, show an error
        if (!studentsData || studentsData.length === 0) {
          console.log('No students found for this class and subject');
          setError('No students found for this class and subject. Please check your teacher-subject assignments.');
          setLoading(false);
          return;
        }

        setStudents(studentsData);

        // Fetch existing marks
        const response = await api.get(`/api/marks?class=${selectedClass}&subject=${selectedSubject}&exam=${selectedExam}`);
        const existingMarks = response.data;

        // Create marks array with existing marks or empty values
        const marksArray = studentsData.map(student => {
          const existingMark = existingMarks.find(mark => mark.student._id === student._id);
          return {
            studentId: student._id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            gender: student.gender,
            marksObtained: existingMark ? existingMark.marksObtained : '',
            comment: existingMark ? existingMark.comment : '',
            educationLevel: student.educationLevel || 'O_LEVEL'
          };
        });

        setMarks(marksArray);
      } catch (error) {
        console.error('Error fetching students and marks:', error);
        setError('Failed to fetch students and marks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndMarks();
  }, [selectedClass, selectedSubject, selectedExam]);

  // Handle class change
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedSubject('');
    setSelectedExam('');
  };

  // Handle subject change
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    setSelectedExam('');
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle mark change
  const handleMarkChange = (index, value) => {
    const updatedMarks = [...marks];
    updatedMarks[index].marksObtained = value;
    setMarks(updatedMarks);
  };

  // Handle comment change
  const handleCommentChange = (index, value) => {
    const updatedMarks = [...marks];
    updatedMarks[index].comment = value;
    setMarks(updatedMarks);
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      setError('Please select a class, subject, and exam.');
      return;
    }

    // Validate marks
    const invalidMarks = marks.filter(mark => {
      const marksValue = Number(mark.marksObtained);
      return mark.marksObtained !== '' && (isNaN(marksValue) || marksValue < 0 || marksValue > 100);
    });

    if (invalidMarks.length > 0) {
      setError('Some marks are invalid. Marks must be between 0 and 100.');
      return;
    }

    try {
      setLoading(true);

      // Filter out empty marks
      const marksToSave = marks.filter(mark => mark.marksObtained !== '');

      if (marksToSave.length === 0) {
        setError('No marks to save. Please enter at least one mark.');
        setLoading(false);
        return;
      }

      // Save marks - try the enhanced API service first
      let result;
      try {
        console.log('Saving marks using enhanced API service');
        result = await enhancedTeacherApiService.enterMarks(
          selectedClass,
          selectedSubject,
          selectedExam,
          marksToSave
        );
      } catch (apiError) {
        console.log('Enhanced API service failed, falling back to regular service');
        // Fall back to the regular service
        result = await enhancedTeacherService.enterMarks(
          selectedClass,
          selectedSubject,
          selectedExam,
          marksToSave
        );
      }

      setSuccess(`Successfully saved ${result.results.length} marks.`);
    } catch (error) {
      console.error('Error saving marks:', error);
      setError(`Failed to save marks: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Diagnose and fix assignments
  const handleDiagnoseAssignments = async () => {
    if (!selectedClass) {
      setError('Please select a class.');
      return;
    }

    try {
      setLoading(true);

      // Get the teacher profile - try the enhanced API service first
      let teacherProfile;
      try {
        console.log('Getting teacher profile using enhanced API service');
        teacherProfile = await enhancedTeacherApiService.getTeacherProfile();
      } catch (apiError) {
        console.log('Enhanced API service failed, falling back to regular service');
        // Fall back to the regular service
        teacherProfile = await enhancedTeacherService.getTeacherProfile();
      }

      // Diagnose and fix assignments - try the enhanced API service first
      let result;
      try {
        console.log('Diagnosing assignments using enhanced API service');
        result = await enhancedTeacherApiService.diagnoseAndFixAssignments(
          teacherProfile._id,
          selectedClass
        );
      } catch (apiError) {
        console.log('Enhanced API service failed, falling back to regular service');
        // Fall back to the regular service
        result = await enhancedTeacherService.diagnoseAndFixAssignments(
          teacherProfile._id,
          selectedClass
        );
      }

      setDiagnosticResult(result);
      setShowDiagnostic(true);

      if (result.success) {
        setSuccess('Diagnosis complete. Any issues have been fixed.');

        // Refresh subjects - try the enhanced API service first
        let assignedSubjects;
        try {
          console.log('Refreshing subjects using enhanced API service');
          assignedSubjects = await enhancedTeacherApiService.getAssignedSubjects(selectedClass);
        } catch (apiError) {
          console.log('Enhanced API service failed, falling back to regular service');
          // Fall back to the regular service
          assignedSubjects = await enhancedTeacherService.getAssignedSubjects(selectedClass, false);
        }
        setSubjects(assignedSubjects);
      } else {
        setError(`Diagnosis failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error diagnosing assignments:', error);
      setError(`Failed to diagnose assignments: ${error.response?.data?.message || error.message}`);
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

  // Toggle diagnostic display
  const toggleDiagnostic = () => {
    setShowDiagnostic(!showDiagnostic);
  };

  // Render the diagnostic result
  const renderDiagnosticResult = () => {
    if (!diagnosticResult || !showDiagnostic) return null;

    return (
      <Card sx={{ mt: 2, mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" gutterBottom>
              Diagnostic Result
            </Typography>
            <Button size="small" onClick={toggleDiagnostic}>
              Hide
            </Button>
          </Box>

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
            <Box mt={2}>
              <Typography variant="subtitle1">
                Issues Found:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Issue</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diagnosticResult.diagnostic.issues.map((issue, index) => (
                      <TableRow key={index}>
                        <TableCell>{issue.subject}</TableCell>
                        <TableCell>{issue.issue}</TableCell>
                        <TableCell>{issue.type}</TableCell>
                        <TableCell>
                          <Tooltip title="Fixed">
                            <CheckCircle color="success" />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {diagnosticResult.fixResult && (
            <Box mt={2}>
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
          Enhanced Bulk Marks Entry
        </Typography>
        <Typography variant="body1" paragraph>
          Enter marks for multiple students at once using the enhanced teacher assignment system.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={handleSubjectChange}
                label="Subject"
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={handleExamChange}
                label="Exam"
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select an exam</em>
                </MenuItem>
                {exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name} ({exam.term})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="space-between">
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleDiagnoseAssignments}
              disabled={loading || !selectedClass}
              startIcon={loading ? <CircularProgress size={20} /> : <Info />}
            >
              Diagnose Assignments
            </Button>

            <Button
              component={Link}
              to="/admin/student-class-diagnostic"
              variant="outlined"
              color="secondary"
              sx={{ ml: 1 }}
              startIcon={<Warning />}
            >
              Advanced Diagnostic
            </Button>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveMarks}
            disabled={loading || !selectedClass || !selectedSubject || !selectedExam || marks.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            Save Marks
          </Button>
        </Box>

        {renderDiagnosticResult()}

        {marks.length > 0 ? (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Marks (0-100)</TableCell>
                  <TableCell>Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marks.map((mark, index) => (
                  <TableRow key={mark.studentId}>
                    <TableCell>{mark.rollNumber}</TableCell>
                    <TableCell>{mark.studentName}</TableCell>
                    <TableCell>{mark.gender}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={mark.marksObtained}
                        onChange={(e) => handleMarkChange(index, e.target.value)}
                        inputProps={{ min: 0, max: 100 }}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={mark.comment}
                        onChange={(e) => handleCommentChange(index, e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          selectedClass && selectedSubject && selectedExam && (
            <Box mt={3} textAlign="center">
              <Typography variant="body1">
                No students found for this class and subject.
              </Typography>
            </Box>
          )
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
    </Container>
  );
};

export default EnhancedBulkMarksEntry;
