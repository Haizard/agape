import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Checkbox
} from '@mui/material';
import axios from 'axios';
import api from '../../utils/api';

/**
 * A-Level Marks Entry Component
 * A simple component for entering A-Level marks for testing purposes
 */
const ALevelMarksEntry = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState('');
  const [comment, setComment] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);
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

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjectsByClass(selectedClass);
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  // Fetch initial data (classes, exams)
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, examsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/exams')
      ]);

      // Filter for A-Level classes
      const aLevelClasses = (classesRes.data || []).filter(cls => cls.educationLevel === 'A_LEVEL');
      setClasses(aLevelClasses);
      setExams(examsRes.data || []);
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
      // Use the correct endpoint for fetching students by class
      const response = await api.get(`/students/class/${classId}`);

      // Filter for A-Level students
      const aLevelStudents = (response.data || []).filter(student => student.educationLevel === 'A_LEVEL');
      setStudents(aLevelStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects by class
  const fetchSubjectsByClass = async (classId) => {
    setLoading(true);
    try {
      const response = await api.get(`/classes/${classId}`);
      const classData = response.data;

      if (classData.subjects && classData.subjects.length > 0) {
        // Extract subject IDs from class data
        const subjectIds = classData.subjects.map(s =>
          typeof s === 'object' ? s.subject._id || s.subject : s
        );

        // Fetch subject details
        const subjectsResponse = await api.get('/subjects');
        const allSubjects = subjectsResponse.data || [];

        // Filter subjects that belong to this class
        const classSubjects = allSubjects.filter(subject =>
          subjectIds.includes(subject._id)
        );

        setSubjects(classSubjects);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedStudent('');
    setSelectedSubject('');
  };

  // Handle student selection
  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
  };

  // Handle subject selection
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);

    // Check if the selected subject is principal
    const subject = subjects.find(s => s._id === e.target.value);
    if (subject) {
      setIsPrincipal(subject.isPrincipal || false);
      console.log(`Selected subject ${subject.name} is ${subject.isPrincipal ? 'a principal' : 'a subsidiary'} subject`);
    }
  };

  // Handle exam selection
  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
  };

  // Handle marks input
  const handleMarksChange = (e) => {
    const value = e.target.value;
    // Validate marks (0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setMarks(value);
    }
  };

  // Handle comment input
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  // Calculate A-Level grade based on marks
  const calculateGrade = (marks) => {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  };

  // Calculate A-Level points based on grade
  const calculatePoints = (grade) => {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'E': return 5;
      case 'S': return 6;
      case 'F': return 7;
      default: return 0;
    }
  };

  // Handle principal checkbox change
  const handlePrincipalChange = (e) => {
    setIsPrincipal(e.target.checked);
    console.log(`Subject is now marked as ${e.target.checked ? 'principal' : 'subsidiary'}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedSubject || !selectedExam || !marks) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Get the selected student to check education level
      const student = students.find(s => s._id === selectedStudent);
      if (!student) {
        throw new Error('Selected student not found');
      }

      // Get the selected subject to check if it's principal
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) {
        throw new Error('Selected subject not found');
      }

      // Get the selected exam to get academic year
      const exam = exams.find(e => e._id === selectedExam);
      if (!exam) {
        throw new Error('Selected exam not found');
      }

      // Calculate grade and points
      const grade = calculateGrade(Number(marks));
      const points = calculatePoints(grade);

      // Prepare data for API call
      const resultData = {
        studentId: selectedStudent,
        examId: selectedExam,
        academicYearId: exam.academicYear,
        examTypeId: exam.examType,
        subjectId: selectedSubject,
        classId: selectedClass,
        marksObtained: Number(marks),
        grade,
        points,
        comment,
        educationLevel: 'A_LEVEL',
        isPrincipal: isPrincipal // Use the state value for isPrincipal
      };

      console.log(`Subject ${subject.name} is ${subject.isPrincipal ? 'a principal' : 'a subsidiary'} subject`);

      console.log('Submitting A-Level result:', resultData);

      // Submit to the ALevelResult model
      const response = await api.post('/a-level-results/enter-marks', resultData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Reset form
      setMarks('');
      setComment('');
    } catch (err) {
      console.error('Error saving marks:', err);
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.message || 'Unknown error'}`,
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

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        A-Level Marks Entry
      </Typography>

      <Typography variant="body1" paragraph>
        Use this form to enter marks for A-Level students. This is a simplified form for testing purposes.
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
          <Grid item xs={12} md={6}>
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
                {Array.isArray(classes) && classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section || ''} {cls.stream || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
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
                {Array.isArray(students) && students.map(student => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {Array.isArray(subjects) && subjects.map(subject => (
                  <MenuItem
                    key={subject._id}
                    value={subject._id}
                    sx={{
                      fontWeight: subject.isPrincipal ? 'bold' : 'normal',
                      color: subject.isPrincipal ? 'primary.main' : 'inherit',
                    }}
                  >
                    {subject.name} ({subject.isPrincipal ? 'PRINCIPAL' : 'Subsidiary'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
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
                {Array.isArray(exams) && exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Marks"
              type="number"
              value={marks}
              onChange={handleMarksChange}
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              disabled={loading}
              required
              helperText={marks ? `Grade: ${calculateGrade(Number(marks))}, Points: ${calculatePoints(calculateGrade(Number(marks)))}` : ''}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Comment"
              value={comment}
              onChange={handleCommentChange}
              fullWidth
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPrincipal}
                    onChange={handlePrincipalChange}
                    disabled={loading}
                    color="primary"
                  />
                }
                label="Principal Subject"
              />
              <Typography variant="caption" color="textSecondary">
                Principal subjects are used to calculate division
              </Typography>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !selectedStudent || !selectedSubject || !selectedExam || !marks}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Marks'}
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

export default ALevelMarksEntry;
