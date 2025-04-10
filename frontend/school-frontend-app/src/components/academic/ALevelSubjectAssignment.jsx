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
  TableRow,
  Snackbar
} from '@mui/material';
import api from '../../services/api';

/**
 * Component for assigning subject combinations to A-Level students
 */
const ALevelSubjectAssignment = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nonALevelStudents, setNonALevelStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCombination, setSelectedCombination] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
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
      setClassStudents([]);
    }
  }, [selectedClass]);

  // Fetch initial data (classes, combinations, students)
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch classes and combinations in parallel
      const [classesRes, combinationsRes] = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/subject-combinations?educationLevel=A_LEVEL&active=true')
      ]);

      // Filter for A-Level classes
      const aLevelClasses = classesRes.data.filter(cls => cls.educationLevel === 'A_LEVEL');
      console.log(`Found ${aLevelClasses.length} A-Level classes`);
      setClasses(aLevelClasses);

      // Set combinations
      console.log(`Found ${combinationsRes.data.length} A-Level subject combinations`);
      setCombinations(combinationsRes.data);

      // Fetch all students
      const studentsRes = await api.get('/api/students');

      // Filter for A-Level students
      const aLevelStudents = studentsRes.data.filter(student => student.educationLevel === 'A_LEVEL');
      console.log(`Found ${aLevelStudents.length} A-Level students in total`);
      setStudents(aLevelStudents);

      // Fetch existing assignments
      await fetchExistingAssignments();
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
      console.log(`Fetching students for class: ${classId}`);

      // First, get all students in the class to check for non-A-Level students
      const allStudentsResponse = await api.get(`/api/students/class/${classId}`);
      console.log('All students in class:', allStudentsResponse.data);

      // Check if there are any non-A-Level students
      const nonALevel = allStudentsResponse.data.filter(student => student.educationLevel !== 'A_LEVEL');
      setNonALevelStudents(nonALevel);

      if (nonALevel.length > 0) {
        console.log(`Found ${nonALevel.length} non-A-Level students in class ${classId}`);
        for (const student of nonALevel) {
          console.log(`Non-A-Level student: ${student.firstName} ${student.lastName}, ID: ${student._id}, Level: ${student.educationLevel}`);
        }
      }

      // Use the new endpoint specifically for A-Level students
      const response = await api.get(`/api/students/a-level/class/${classId}`);
      console.log('API response for A-Level students:', response.data);

      if (!response.data || response.data.length === 0) {
        console.log(`No A-Level students found in class ${classId}`);
        setClassStudents([]);

        // If there are non-A-Level students, show a message
        if (nonALevel.length > 0) {
          setError(`No A-Level students found in this class. There are ${nonALevel.length} students that need to be updated to A-Level.`);
        } else {
          setError('No students found in this class.');
        }
        return;
      }

      // No need to filter as the endpoint already returns only A-Level students
      const aLevelStudents = response.data;

      console.log(`Found ${aLevelStudents.length} A-Level students in class ${classId}`);

      // Log each student for debugging
      for (const student of aLevelStudents) {
        console.log(`A-Level student: ${student.firstName} ${student.lastName}, ID: ${student._id}`);
      }

      setClassStudents(aLevelStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(`Failed to load students: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing subject combination assignments
  const fetchExistingAssignments = async () => {
    setLoading(true);
    try {
      // Get all students
      const response = await api.get('/api/students');

      // Filter for A-Level students with subject combinations
      const studentsWithCombinations = response.data
        .filter(student => student.educationLevel === 'A_LEVEL' && student.subjectCombination)
        .map(student => ({
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          class: student.class,
          subjectCombination: student.subjectCombination
        }));

      console.log(`Found ${studentsWithCombinations.length} A-Level students with subject combinations`);
      setStudentAssignments(studentsWithCombinations);
    } catch (err) {
      console.error('Error fetching existing assignments:', err);
      setError('Failed to load existing assignments. Please try again.');
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
    const studentId = e.target.value;
    setSelectedStudent(studentId);

    // Check if student already has a combination assigned
    const student = students.find(s => s._id === studentId);
    if (student?.subjectCombination) {
      console.log(`Student ${studentId} already has combination:`, student.subjectCombination);
      setSelectedCombination(student.subjectCombination);
    } else {
      console.log(`Student ${studentId} has no combination assigned`);
      setSelectedCombination('');
    }
  };

  // Handle combination selection
  const handleCombinationChange = (e) => {
    setSelectedCombination(e.target.value);
  };

  // Assign subject combination to student
  const handleAssignCombination = async () => {
    if (!selectedStudent || !selectedCombination) {
      setSnackbar({
        open: true,
        message: 'Please select both a student and a subject combination',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Find the student and combination details for better logging
      const student = students.find(s => s._id === selectedStudent);
      const combination = combinations.find(c => c._id === selectedCombination);

      console.log(`Assigning combination ${combination?.name || selectedCombination} to student ${student?.firstName} ${student?.lastName || selectedStudent}`);

      // Update student with selected combination
      const response = await api.put(`/api/students/${selectedStudent}`, {
        subjectCombination: selectedCombination,
        educationLevel: 'A_LEVEL' // Ensure the student is marked as A-Level
      });

      console.log('Student updated successfully:', response.data);

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student._id === selectedStudent
            ? { ...student, subjectCombination: selectedCombination }
            : student
        )
      );

      // Update class students
      setClassStudents(prevStudents =>
        prevStudents.map(student =>
          student._id === selectedStudent
            ? { ...student, subjectCombination: selectedCombination }
            : student
        )
      );

      // Refresh assignments
      await fetchExistingAssignments();

      // Show success message
      setSnackbar({
        open: true,
        message: `Subject combination ${combination?.name || ''} assigned successfully to ${student?.firstName || ''} ${student?.lastName || ''}`,
        severity: 'success'
      });

      // Reset selection
      setSelectedStudent('');
      setSelectedCombination('');
    } catch (err) {
      console.error('Error assigning subject combination:', err);
      setSnackbar({
        open: true,
        message: `Failed to assign subject combination: ${err.message || 'Unknown error'}`,
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

  // Update students to A-Level
  const updateStudentsToALevel = async () => {
    if (nonALevelStudents.length === 0) {
      setSnackbar({
        open: true,
        message: 'No students to update',
        severity: 'info'
      });
      return;
    }

    setLoading(true);
    try {
      // Update each student to A-Level
      const updatePromises = nonALevelStudents.map(student =>
        api.put(`/api/students/${student._id}`, {
          educationLevel: 'A_LEVEL'
        })
      );

      await Promise.all(updatePromises);

      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully updated ${nonALevelStudents.length} students to A-Level`,
        severity: 'success'
      });

      // Clear the non-A-Level students list
      setNonALevelStudents([]);

      // Clear any error messages
      setError('');

      // Refresh the student list
      if (selectedClass) {
        await fetchStudentsByClass(selectedClass);
      }
    } catch (err) {
      console.error('Error updating students to A-Level:', err);
      setSnackbar({
        open: true,
        message: `Failed to update students: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        A-Level Subject Combination Assignment
      </Typography>

      <Typography variant="body1" paragraph>
        Use this form to assign subject combinations to A-Level students.
        Each A-Level student must be assigned a subject combination that determines
        their principal and subsidiary subjects.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
          action={
            nonALevelStudents.length > 0 && (
              <Button
                color="inherit"
                size="small"
                onClick={updateStudentsToALevel}
                disabled={loading}
              >
                {loading ? 'Updating...' : `Update ${nonALevelStudents.length} Students to A-Level`}
              </Button>
            )
          }
        >
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
              {classStudents.map(student => (
                <MenuItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Subject Combination</InputLabel>
            <Select
              value={selectedCombination}
              label="Subject Combination"
              onChange={handleCombinationChange}
              disabled={loading || !selectedStudent}
            >
              <MenuItem value="">
                <em>Select a combination</em>
              </MenuItem>
              {combinations.map(combination => (
                <MenuItem key={combination._id} value={combination._id}>
                  {combination.name} ({combination.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignCombination}
              disabled={loading || !selectedStudent || !selectedCombination}
              sx={{ minWidth: 200 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Assign Combination'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Existing Assignments
      </Typography>

      {studentAssignments.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Student</strong></TableCell>
                <TableCell><strong>Roll Number</strong></TableCell>
                <TableCell><strong>Class</strong></TableCell>
                <TableCell><strong>Subject Combination</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentAssignments.map(assignment => {
                // Find the combination details
                const combinationId = typeof assignment.subjectCombination === 'object'
                  ? assignment.subjectCombination._id
                  : assignment.subjectCombination;
                const combination = combinations.find(c => c._id === combinationId);

                // Find the class details
                const classId = typeof assignment.class === 'object'
                  ? assignment.class._id
                  : assignment.class;
                const classDetails = classes.find(c => c._id === classId);

                console.log(`Assignment for ${assignment.name}: Class=${classId}, Combination=${combinationId}`);

                return (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.name}</TableCell>
                    <TableCell>{assignment.rollNumber}</TableCell>
                    <TableCell>
                      {classDetails
                        ? `${classDetails.name} ${classDetails.section || ''} ${classDetails.stream || ''}`
                        : 'Unknown Class'}
                    </TableCell>
                    <TableCell>
                      {combination
                        ? (
                          <Chip
                            label={`${combination.name} (${combination.code})`}
                            color="primary"
                            variant="outlined"
                          />
                        )
                        : 'Unknown Combination'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No subject combinations have been assigned to A-Level students yet.
        </Alert>
      )}

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

export default ALevelSubjectAssignment;
