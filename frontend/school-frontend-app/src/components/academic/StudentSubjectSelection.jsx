import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import api from '../../services/api';

const StudentSubjectSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [coreSubjects, setCoreSubjects] = useState([]);
  const [optionalSubjects, setOptionalSubjects] = useState([]);
  const [selectionRules, setSelectionRules] = useState(null);
  const [existingSelections, setExistingSelections] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedOptionalSubjects, setSelectedOptionalSubjects] = useState([]);
  const [notes, setNotes] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          studentsRes,
          classesRes,
          academicYearsRes,
          coreSubjectsRes,
          optionalSubjectsRes,
          rulesRes,
          selectionsRes
        ] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/classes'),
          api.get('/api/academic-years'),
          api.get('/api/student-subject-selections/core-subjects'),
          api.get('/api/student-subject-selections/available-optional-subjects').then(res => {
            console.log('Optional subjects response:', res.data);
            return res;
          }),
          api.get('/api/student-subject-selections/selection-rules'),
          api.get('/api/student-subject-selections')
        ]);

        setStudents(studentsRes.data);
        setClasses(classesRes.data);
        setAcademicYears(academicYearsRes.data);
        setCoreSubjects(coreSubjectsRes.data);
        setOptionalSubjects(optionalSubjectsRes.data);
        setSelectionRules(rulesRes.data);
        setExistingSelections(selectionsRes.data);

        // Set default academic year if available
        const activeYear = academicYearsRes.data.find(year => year.isActive);
        if (activeYear) {
          setSelectedAcademicYear(activeYear._id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle student selection
  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);

    // Check if student already has a selection
    const existingSelection = existingSelections.find(
      selection => selection.student._id === studentId
    );

    if (existingSelection) {
      setSelectedClass(existingSelection.selectionClass._id);
      setSelectedAcademicYear(existingSelection.academicYear._id);
      setSelectedOptionalSubjects(
        existingSelection.optionalSubjects.map(subject => subject._id)
      );
      setNotes(existingSelection.notes || '');
    } else {
      // Reset other selections
      setSelectedOptionalSubjects([]);
      setNotes('');
    }
  };

  // Handle optional subject selection
  const handleOptionalSubjectChange = (subjectId) => {
    setSelectedOptionalSubjects(prev => {
      // If subject is already selected, remove it
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      }

      // Check if we've reached the maximum
      if (selectionRules?.O_LEVEL?.maxOptionalSubjects &&
          prev.length >= selectionRules.O_LEVEL.maxOptionalSubjects) {
        setError(`You can only select up to ${selectionRules.O_LEVEL.maxOptionalSubjects} optional subjects`);
        return prev;
      }

      // Add the subject
      return [...prev, subjectId];
    });
  };

  // Add default optional subjects if none exist
  const handleAddOptionalSubjects = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/student-subject-selections/add-optional-subjects');
      console.log('Added optional subjects:', response.data);

      // Refresh the optional subjects list
      const optionalSubjectsRes = await api.get('/api/student-subject-selections/available-optional-subjects');
      setOptionalSubjects(optionalSubjectsRes.data);

      setSuccess('Optional subjects added successfully');
    } catch (err) {
      console.error('Error adding optional subjects:', err);
      setError('Failed to add optional subjects');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    if (!selectedAcademicYear) {
      setError('Please select an academic year');
      return;
    }

    // Check minimum optional subjects
    const minOptional = selectionRules?.O_LEVEL?.minOptionalSubjects || 2;
    if (selectedOptionalSubjects.length < minOptional) {
      setError(`Please select at least ${minOptional} optional subjects`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if student already has a selection
      const existingSelection = existingSelections.find(
        selection => selection.student._id === selectedStudent &&
                    selection.academicYear._id === selectedAcademicYear
      );

      let response;

      if (existingSelection) {
        // Update existing selection
        response = await api.put(`/api/student-subject-selections/${existingSelection._id}`, {
          optionalSubjects: selectedOptionalSubjects,
          notes
        });

        setSuccess('Subject selection updated successfully');
      } else {
        // Create new selection
        response = await api.post('/api/student-subject-selections', {
          student: selectedStudent,
          selectionClass: selectedClass,
          academicYear: selectedAcademicYear,
          optionalSubjects: selectedOptionalSubjects,
          notes
        });

        // Add to existing selections
        setExistingSelections(prev => [...prev, response.data]);

        setSuccess('Subject selection created successfully');
      }

      // Reset form
      setSelectedStudent('');
      setSelectedClass('');
      setSelectedOptionalSubjects([]);
      setNotes('');

    } catch (err) {
      console.error('Error saving subject selection:', err);
      setError(err.response?.data?.message || 'Failed to save subject selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Student Subject Selection
      </Typography>

      <Typography variant="body1" paragraph>
        Use this form to select optional subjects for O-Level students. Core subjects are automatically assigned.
        Students will study these subjects throughout their O-Level education (Form 1-4).
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudent}
              label="Student"
              onChange={handleStudentChange}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a student</em>
              </MenuItem>
              {students.map(student => (
                <MenuItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} ({student.admissionNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select a class</em>
              </MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name} {cls.stream} {cls.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedAcademicYear}
              label="Academic Year"
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>Select an academic year</em>
              </MenuItem>
              {academicYears.map(year => (
                <MenuItem key={year._id} value={year._id}>
                  {year.name} {year.isActive && '(Active)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Core Subjects (Automatically Assigned)
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigate('/admin/core-subjects')}
            >
              Manage Core Subjects
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Subject Name</strong></TableCell>
                  <TableCell><strong>Code</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coreSubjects.map(subject => (
                  <TableRow key={subject._id}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Optional Subjects
              {selectionRules?.O_LEVEL && (
                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                  (Select {selectionRules.O_LEVEL.minOptionalSubjects}-{selectionRules.O_LEVEL.maxOptionalSubjects} subjects)
                </Typography>
              )}
            </Typography>
            <Box>
              {optionalSubjects.length === 0 && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={handleAddOptionalSubjects}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Add Default Subjects
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => navigate('/admin/academic-management#optional-subjects')}
              >
                Manage Subjects
              </Button>
            </Box>
          </Box>

          <FormGroup>
            <Grid container spacing={2}>
              {optionalSubjects.length > 0 ? (
                optionalSubjects.map(subject => (
                  <Grid item xs={12} sm={6} md={4} key={subject._id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedOptionalSubjects.includes(subject._id)}
                          onChange={() => handleOptionalSubjectChange(subject._id)}
                          disabled={
                            loading ||
                            (selectedOptionalSubjects.length >= (selectionRules?.O_LEVEL?.maxOptionalSubjects || 4) &&
                             !selectedOptionalSubjects.includes(subject._id))
                          }
                        />
                      }
                      label={`${subject.name} (${subject.code})`}
                    />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No optional subjects are available. Please click the "Add Optional Subjects" button above to add some default optional subjects.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Subject Selection'}
          </Button>
        </Grid>
      </Grid>

      {existingSelections.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Existing Subject Selections
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Academic Year</strong></TableCell>
                  <TableCell><strong>Optional Subjects</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingSelections.map(selection => (
                  <TableRow key={selection._id}>
                    <TableCell>
                      {selection.student.firstName} {selection.student.lastName}
                    </TableCell>
                    <TableCell>
                      {selection.selectionClass.name} {selection.selectionClass.stream}
                    </TableCell>
                    <TableCell>
                      {selection.academicYear.name}
                    </TableCell>
                    <TableCell>
                      {selection.optionalSubjects.map(subject => (
                        <Chip
                          key={subject._id}
                          label={subject.name}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={selection.status}
                        color={selection.status === 'APPROVED' ? 'success' :
                               selection.status === 'REJECTED' ? 'error' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

export default StudentSubjectSelection;
