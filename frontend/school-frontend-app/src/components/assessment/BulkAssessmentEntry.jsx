import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAssessment } from '../../contexts/AssessmentContext';
import { validateMarks } from '../../utils/assessmentValidation';
import { useCallback } from 'react';

const BulkAssessmentEntry = () => {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  const { assessments } = useAssessment();
  
  // Filter active assessments by term and sort by displayOrder
  const activeAssessments = assessments
    .filter(a => a.isVisible && a.term === selectedTerm)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTeacherSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && teacherSubjects.length > 0) {
      fetchStudents();
    }
  }, [selectedClass, teacherSubjects]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher-classes/my-classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      // Ensure classes is always an array
      const classesArray = Array.isArray(data) ? data :
                         Array.isArray(data.classes) ? data.classes : [];

      setClasses(classesArray);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to fetch classes');
      setClasses([]); // Initialize as empty array on erro
    }
  };

  const fetchTeacherSubjects = async () => {
    try {
      const response = await fetch(`/api/teachers/subjects/${selectedClass}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTeacherSubjects(data);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      setError('Failed to fetch teacher subjects');
      setTeacherSubjects([]);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher/students/${selectedClass}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      // Ensure data is an array
      const studentsArray = Array.isArray(data) ? data :
                          Array.isArray(data.students) ? data.students : [];

      // Filter students who take the teacher's subjects
      const filteredStudents = studentsArray.filter(student => 
        student.subjects.some(subjectId => 
          teacherSubjects.some(ts => ts.subjectId === subjectId)
        )
      );

      setStudents(filteredStudents);

      // Initialize marks object
      const initialMarks = {};
      filteredStudents.forEach(student => {
        initialMarks[student._id] = '';
      });
      setMarks(initialMarks);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      setStudents([]); // Initialize as empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, assessmentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentId]: value
      }
    }));
  };

  const validateAllMarks = () => {
    let isValid = true;
    const errors = {};

    Object.entries(marks).forEach(([studentId, studentMarks]) => {
      Object.entries(studentMarks).forEach(([assessmentId, mark]) => {
        if (mark === '') return;

        const assessment = assessments.find(a => a._id === assessmentId);
        if (!assessment) return;

        const validation = validateMarks(mark, assessment.maxMarks);
        if (!validation.isValid) {
          isValid = false;
          if (!errors[studentId]) errors[studentId] = {};
          errors[studentId][assessmentId] = validation.errors.marksObtained;
        }
      });
    });

    return { isValid, errors };
  };

  const handleSave = async () => {
    const validation = validateAllMarks();
    if (!validation.isValid) {
      setSnackbar({
        open: true,
        message: 'Please correct invalid marks',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const marksData = [];
      Object.entries(marks).forEach(([studentId, studentMarks]) => {
        Object.entries(studentMarks).forEach(([assessmentId, mark]) => {
          if (mark !== '') {
            marksData.push({
              studentId,
              assessmentId,
              marksObtained: Number(mark)
            });
          }
        });
      });

      const response = await fetch('/api/assessments/bulk-marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ marks: marksData })
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Marks saved successfully',
          severity: 'success'
        });
        fetchStudents(); // Refresh data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save marks',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulk Assessment Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Class"
            >
              {Array.isArray(classes) && classes.length > 0 ? (
                classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No classes available</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Term</InputLabel>
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              label="Term"
            >
              <MenuItem value="1">Term 1</MenuItem>
              <MenuItem value="2">Term 2</MenuItem>
              <MenuItem value="3">Term 3</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedClass && activeAssessments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ mr: 1 }}
          >
            Save Marks
          </Button>
          <Button
            variant="outlined"
            onClick={fetchStudents}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Registration Number</TableCell>
              {activeAssessments.map(assessment => (
                <TableCell key={assessment._id} align="right">
                  {assessment.name} ({assessment.weightage}%)
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map(student => (
                <TableRow key={student._id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.registrationNumber}</TableCell>
                  {activeAssessments.map(assessment => (
                    <TableCell key={assessment._id} align="right">
                      <TextField
                        type="number"
                        value={marks[student._id]?.[assessment._id] || ''}
                        onChange={(e) => handleMarkChange(student._id, assessment._id, e.target.value)}
                        disabled={loading}
                        inputProps={{
                          min: 0,
                          max: assessment.maxMarks
                        }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BulkAssessmentEntry;