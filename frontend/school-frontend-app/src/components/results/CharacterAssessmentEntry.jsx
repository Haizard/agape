import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import api from '../../services/api';

/**
 * Character Assessment Entry Component
 * A component for entering character assessments for students
 */
const CharacterAssessmentEntry = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [assessment, setAssessment] = useState({
    punctuality: 'Good',
    discipline: 'Good',
    respect: 'Good',
    leadership: 'Good',
    participation: 'Good',
    overallAssessment: 'Good',
    comments: ''
  });
  const [assessmentId, setAssessmentId] = useState(null);
  const [editingComments, setEditingComments] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  // Fetch initial data (classes, exams)
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, examsRes] = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/exams')
      ]);

      setClasses(classesRes.data);
      setExams(examsRes.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students by class
  const fetchStudentsByClass = async (classId) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/students/class/${classId}`);
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing assessment if available
  const fetchExistingAssessment = async () => {
    if (!selectedStudent || !selectedExam) return;

    setLoading(true);
    try {
      const response = await api.get(`/api/character-assessments/${selectedStudent}/${selectedExam}`);

      if (response.data) {
        setAssessment({
          punctuality: response.data.punctuality || 'Good',
          discipline: response.data.discipline || 'Good',
          respect: response.data.respect || 'Good',
          leadership: response.data.leadership || 'Good',
          participation: response.data.participation || 'Good',
          overallAssessment: response.data.overallAssessment || 'Good',
          comments: response.data.comments || ''
        });

        // Store the assessment ID for later use (editing/updating)
        setAssessmentId(response.data._id);
        setSuccess('Loaded existing assessment');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // No assessment found, use default values
        setAssessment({
          punctuality: 'Good',
          discipline: 'Good',
          respect: 'Good',
          leadership: 'Good',
          participation: 'Good',
          overallAssessment: 'Good',
          comments: ''
        });
      } else {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedStudent('');
  };

  // Handle student selection
  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
    if (selectedExam) {
      fetchExistingAssessment();
    }
  };

  // Handle exam selection
  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
    if (selectedStudent) {
      fetchExistingAssessment();
    }
  };

  // Handle assessment field change
  const handleAssessmentChange = (field) => (e) => {
    setAssessment({
      ...assessment,
      [field]: e.target.value
    });
  };

  // Handle form submission for full assessment
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedExam || !selectedClass) {
      setSnackbar({
        open: true,
        message: 'Please select a class, student, and exam',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Get the selected exam to get academic year
      const exam = exams.find(e => e._id === selectedExam);
      if (!exam) {
        throw new Error('Selected exam not found');
      }

      // Prepare data for API call
      const assessmentData = {
        studentId: selectedStudent,
        examId: selectedExam,
        academicYearId: exam.academicYear,
        classId: selectedClass,
        ...assessment
      };

      // Submit to the API
      const response = await api.post('/api/character-assessments', assessmentData);

      // Store the assessment ID if it's a new assessment
      if (response.data && response.data.assessment && response.data.assessment._id) {
        setAssessmentId(response.data.assessment._id);
      }

      // Show success message
      setSnackbar({
        open: true,
        message: 'Character assessment saved successfully',
        severity: 'success'
      });

      // Reset form
      setAssessment({
        punctuality: 'Good',
        discipline: 'Good',
        respect: 'Good',
        leadership: 'Good',
        participation: 'Good',
        overallAssessment: 'Good',
        comments: ''
      });
    } catch (err) {
      console.error('Error saving assessment:', err);
      setSnackbar({
        open: true,
        message: `Failed to save assessment: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle updating just the comments
  const handleUpdateComments = async () => {
    if (!assessmentId) {
      setSnackbar({
        open: true,
        message: 'No assessment found to update. Please save the full assessment first.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Submit only the comments to the API
      const response = await api.patch(`/api/character-assessments/comments/${assessmentId}`, {
        comments: assessment.comments
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Comments updated successfully',
        severity: 'success'
      });

      // Exit editing mode
      setEditingComments(false);
    } catch (err) {
      console.error('Error updating comments:', err);
      setSnackbar({
        open: true,
        message: `Failed to update comments: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Rating options
  const ratingOptions = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Character Assessment Entry
      </Typography>

      <Typography variant="body1" paragraph>
        Use this form to enter character assessments for students.
      </Typography>

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

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={handleClassChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section || ''} {cls.stream || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                label="Student"
                onChange={handleStudentChange}
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select a student</em>
                </MenuItem>
                {students.map(student => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
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
                label="Exam"
                onChange={handleExamChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select an exam</em>
                </MenuItem>
                {exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Punctuality</InputLabel>
              <Select
                value={assessment.punctuality}
                label="Punctuality"
                onChange={handleAssessmentChange('punctuality')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Discipline</InputLabel>
              <Select
                value={assessment.discipline}
                label="Discipline"
                onChange={handleAssessmentChange('discipline')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Respect</InputLabel>
              <Select
                value={assessment.respect}
                label="Respect"
                onChange={handleAssessmentChange('respect')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Leadership</InputLabel>
              <Select
                value={assessment.leadership}
                label="Leadership"
                onChange={handleAssessmentChange('leadership')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Participation</InputLabel>
              <Select
                value={assessment.participation}
                label="Participation"
                onChange={handleAssessmentChange('participation')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Overall Assessment</InputLabel>
              <Select
                value={assessment.overallAssessment}
                label="Overall Assessment"
                onChange={handleAssessmentChange('overallAssessment')}
                disabled={loading || !selectedStudent || !selectedExam}
              >
                {ratingOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="Comments"
                value={assessment.comments}
                onChange={handleAssessmentChange('comments')}
                fullWidth
                multiline
                rows={4}
                disabled={loading || !selectedStudent || !selectedExam}
              />

              {assessmentId && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleUpdateComments}
                    disabled={loading || !selectedStudent || !selectedExam}
                    sx={{ mr: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Update Comments Only'}
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !selectedStudent || !selectedExam || !selectedClass}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Full Assessment'}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CharacterAssessmentEntry;
