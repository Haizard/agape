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
  const [studentsWithoutCombinations, setStudentsWithoutCombinations] = useState([]);
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

      // Check for A-Level students without combinations
      const studentsWithoutCombos = aLevelStudents.filter(student => !student.subjectCombination);
      setStudentsWithoutCombinations(studentsWithoutCombos);

      if (studentsWithoutCombos.length > 0) {
        console.warn(`Found ${studentsWithoutCombos.length} A-Level students without subject combinations`);
        setError(`Warning: ${studentsWithoutCombos.length} A-Level students do not have subject combinations assigned. Please assign combinations to all A-Level students.`);
      }

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

      // Get all students in the class, regardless of education level
      const allStudentsResponse = await api.get(`/api/students/class/${classId}`);
      console.log('All students in class:', allStudentsResponse.data);

      if (!allStudentsResponse.data || allStudentsResponse.data.length === 0) {
        console.log(`No students found in class ${classId}`);
        setClassStudents([]);
        setNonALevelStudents([]);
        setError('No students found in this class.');
        return;
      }

      // Separate students by education level
      const aLevelStudents = allStudentsResponse.data.filter(student => student.educationLevel === 'A_LEVEL');
      const nonALevel = allStudentsResponse.data.filter(student => student.educationLevel !== 'A_LEVEL');

      // Set both types of students
      setClassStudents(allStudentsResponse.data); // Set ALL students to display in dropdown
      setNonALevelStudents(nonALevel);

      console.log(`Found ${aLevelStudents.length} A-Level students and ${nonALevel.length} non-A-Level students in class ${classId}`);

      // Show informational message if there are non-A-Level students
      if (nonALevel.length > 0) {
        setError(`Note: ${nonALevel.length} students in this class are not marked as A-Level. You can still select them and they will be automatically updated when assigned a combination.`);
      } else {
        setError(''); // Clear any previous error
      }
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
        .filter(student => student && student.educationLevel === 'A_LEVEL' && student.subjectCombination)
        .map(student => ({
          id: student._id,
          name: `${student.firstName || 'Unknown'} ${student.lastName || ''}`,
          rollNumber: student.rollNumber || 'N/A',
          class: student.class || null,
          subjectCombination: student.subjectCombination || null
        }))
        .filter(assignment => assignment?.id); // Filter out any invalid assignments

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
      const student = classStudents.find(s => s._id === selectedStudent);
      const combination = combinations.find(c => c._id === selectedCombination);

      // Check if student is already A-Level
      const wasAlreadyALevel = student.educationLevel === 'A_LEVEL';

      console.log(`Assigning combination ${combination?.name || selectedCombination} to student ${student?.firstName} ${student?.lastName || selectedStudent}`);
      if (!wasAlreadyALevel) {
        console.log('Student was not A-Level, will be updated automatically');
      }

      // Update student with selected combination
      const response = await api.put(`/api/students/${selectedStudent}`, {
        subjectCombination: selectedCombination,
        educationLevel: 'A_LEVEL', // Ensure the student is marked as A-Level
        firstName: student.firstName, // Include required fields
        lastName: student.lastName
      });

      console.log('Student updated successfully:', response.data);

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student._id === selectedStudent
            ? { ...student, subjectCombination: selectedCombination, educationLevel: 'A_LEVEL' }
            : student
        )
      );

      // Update class students
      setClassStudents(prevStudents =>
        prevStudents.map(student =>
          student._id === selectedStudent
            ? { ...student, subjectCombination: selectedCombination, educationLevel: 'A_LEVEL' }
            : student
        )
      );

      // If student was not A-Level before, update nonALevelStudents list
      if (!wasAlreadyALevel) {
        setNonALevelStudents(prev => prev.filter(s => s._id !== selectedStudent));
      }

      // Update studentsWithoutCombinations list
      setStudentsWithoutCombinations(prev => prev.filter(s => s._id !== selectedStudent));

      // Refresh assignments
      await fetchExistingAssignments();

      // Show success message with additional info if student was updated to A-Level
      const successMessage = wasAlreadyALevel
        ? `Subject combination ${combination?.name || ''} assigned successfully to ${student?.firstName || ''} ${student?.lastName || ''}`
        : `Student ${student?.firstName || ''} ${student?.lastName || ''} was updated to A-Level and assigned to ${combination?.name || ''} combination`;

      setSnackbar({
        open: true,
        message: successMessage,
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
          educationLevel: 'A_LEVEL',
          firstName: student.firstName, // Include required fields
          lastName: student.lastName
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
          severity={error.startsWith('Note:') ? "info" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setError('')}
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
                <MenuItem
                  key={student._id}
                  value={student._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
                  {student.educationLevel === 'A_LEVEL' ? (
                    <Chip
                      size="small"
                      label="A-Level"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label="Not A-Level"
                      color="default"
                      sx={{ ml: 1 }}
                    />
                  )}
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

      {studentsWithoutCombinations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'error.main' }}>
            A-Level Students Without Combinations
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            The following A-Level students do not have subject combinations assigned.
            Please assign combinations to ensure proper academic tracking and reporting.
          </Alert>

          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell><strong>Roll Number</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsWithoutCombinations.map(student => {
                  // Find the class details
                  const classObj = classes.find(c => c._id === (student.class?._id || student.class));

                  return (
                    <TableRow key={student._id} sx={{ bgcolor: 'error.light' }}>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{classObj ? classObj.name : 'Unknown Class'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedStudent(student._id);
                            setSelectedClass(student.class?._id || student.class);
                          }}
                        >
                          Assign Combination
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

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
                if (!assignment) {
                  console.warn('Null assignment found in studentAssignments array');
                  return null; // Skip null assignments
                }

                // Find the combination details
                const combinationId = assignment.subjectCombination && typeof assignment.subjectCombination === 'object'
                  ? assignment.subjectCombination._id
                  : assignment.subjectCombination;
                const combination = combinationId ? combinations.find(c => c && c._id === combinationId) : null;

                // Find the class details
                const classId = assignment.class && typeof assignment.class === 'object'
                  ? assignment.class._id
                  : assignment.class;
                const classDetails = classId ? classes.find(c => c && c._id === classId) : null;

                console.log(`Assignment for ${assignment.name || 'Unknown'}: Class=${classId || 'Unknown'}, Combination=${combinationId || 'Unknown'}`);

                return (
                  <TableRow key={assignment.id || `unknown-${Math.random()}`}>
                    <TableCell>{assignment.name || 'Unknown Student'}</TableCell>
                    <TableCell>{assignment.rollNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {classDetails?.name
                        ? `${classDetails.name} ${classDetails.section || ''} ${classDetails.stream || ''}`
                        : 'Unknown Class'}
                    </TableCell>
                    <TableCell>
                      {combination?.name && combination?.code
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
