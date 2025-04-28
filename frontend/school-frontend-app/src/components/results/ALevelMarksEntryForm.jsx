import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../utils/api';

/**
 * A-Level Marks Entry Form Component
 *
 * This component handles the form for selecting class, subject, and exam
 * for A-Level marks entry.
 */
const ALevelMarksEntryForm = ({
  onFormSubmit,
  loading = false,
  error = '',
  success = '',
  isAdmin = false,
  onRefresh = () => {}
}) => {
  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Load classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setFormLoading(true);
        setFormError('');

        // Fetch A-Level classes
        const response = await api.get('/api/classes?educationLevel=A_LEVEL');
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setFormError('Failed to load classes. Please try again.');
      } finally {
        setFormLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) return;

      try {
        setFormLoading(true);
        setFormError('');

        // Fetch subjects for the selected class
        let response;

        if (isAdmin) {
          // Admin can see all subjects
          console.log('Admin user - showing all subjects');
          // Fetch subjects using the prisma endpoint
          response = await api.get(`/api/prisma/subjects/class/${selectedClass}`);
          console.log('Prisma subjects response:', response.data);

          if (response.data.success) {
            setSubjects(response.data.data.subjects || []);
          } else {
            // Fallback to the old endpoint
            response = await api.get('/api/subjects');

            // Filter to only show A-Level subjects
            response.data = response.data.filter(subject =>
              subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
            );
            setSubjects(response.data);
          }
        } else {
          // Teachers can only see assigned subjects
          try {
            // Get teacher ID
            const teacherResponse = await api.get('/api/teachers/profile/me');
            const teacherId = teacherResponse.data._id;

            // Fetch teacher's assigned subjects for the class
            const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
              params: { teacherId, classId: selectedClass }
            });

            // assignmentsResponse.data is an array of assignments
            // Each assignment has a subjectId object
            const subjects = assignmentsResponse.data.map(a => a.subjectId);
            setSubjects(subjects);
          } catch (error) {
            console.error('Error fetching teacher subject assignments:', error);
            setSubjects([]);
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setFormError('Failed to load subjects. Please try again.');
      } finally {
        setFormLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, isAdmin]);

  // Load exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setFormLoading(true);
        setFormError('');

        // Fetch active exams
        const response = await api.get('/api/exams?status=active');
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setFormError('Failed to load exams. Please try again.');
      } finally {
        setFormLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Handle form field changes
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSubject('');
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      setFormError('Please select a class, subject, and exam');
      return;
    }

    onFormSubmit({
      classId: selectedClass,
      subjectId: selectedSubject,
      examId: selectedExam
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        A-Level Bulk Marks Entry
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Class selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={handleClassChange}
                disabled={loading || formLoading}
              >
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {Array.isArray(classes) && classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subject selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedClass || loading || formLoading}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {Array.isArray(subjects) && subjects
                  .filter((s, i, arr) => arr.findIndex(x => x._id === s._id) === i)
                  .map(subject => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Exam selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                label="Exam"
                onChange={handleExamChange}
                disabled={loading || formLoading}
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

          {/* Submit button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!selectedClass || !selectedSubject || !selectedExam || loading || formLoading}
              >
                Load Students
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Form loading indicator */}
      {formLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Form error message */}
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}

      {/* Error and success messages from parent */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Refresh button */}
      {selectedClass && selectedSubject && selectedExam && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>
      )}
    </Box>
  );
};

ALevelMarksEntryForm.propTypes = {
  onFormSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  success: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  isAdmin: PropTypes.bool,
  onRefresh: PropTypes.func
};



export default ALevelMarksEntryForm;
