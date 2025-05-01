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

const BulkAssessmentEntry = () => {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const { assessments } = useAssessment();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();

      // Ensure classes is always an array
      const classesArray = Array.isArray(data) ? data :
                         Array.isArray(data.classes) ? data.classes : [];

      setClasses(classesArray);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to fetch classes');
      setClasses([]); // Initialize as empty array on error
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students/class/${selectedClass}`);
      const data = await response.json();

      // Ensure data is an array
      const studentsArray = Array.isArray(data) ? data :
                          Array.isArray(data.students) ? data.students : [];

      setStudents(studentsArray);

      // Initialize marks object
      const initialMarks = {};
      studentsArray.forEach(student => {
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

  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const validateAllMarks = () => {
    const assessment = assessments.find(a => a._id === selectedAssessment);
    if (!assessment) return false;

    let isValid = true;
    const errors = {};

    Object.entries(marks).forEach(([studentId, mark]) => {
      if (mark === '') return;

      const validation = validateMarks(mark, assessment.maxMarks);
      if (!validation.isValid) {
        isValid = false;
        errors[studentId] = validation.errors.marksObtained;
      }
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
      const marksData = Object.entries(marks)
        .filter(([_, mark]) => mark !== '')
        .map(([studentId, mark]) => ({
          studentId,
          assessmentId: selectedAssessment,
          marksObtained: Number(mark)
        }));

      const response = await fetch('/api/assessments/bulk-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            <InputLabel>Assessment</InputLabel>
            <Select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              label="Assessment"
              disabled={!selectedClass}
            >
              {Array.isArray(assessments) && assessments.length > 0 ? (
                assessments.map(assessment => (
                  <MenuItem key={assessment._id} value={assessment._id}>
                    {assessment.name} ({assessment.weightage}%)
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No assessments available</MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedClass && selectedAssessment && (
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
              <TableCell align="right">Marks</TableCell>
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
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={marks[student._id]}
                      onChange={(e) => handleMarkChange(student._id, e.target.value)}
                      disabled={!selectedAssessment || loading}
                      inputProps={{
                        min: 0,
                        max: assessments.find(a => a._id === selectedAssessment)?.maxMarks || 100
                      }}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  </TableCell>
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