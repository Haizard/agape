import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, CircularProgress, Alert, Container,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, MenuItem, IconButton, FormControl, InputLabel, Select,
  Grid, Chip, Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, School as SchoolIcon, Warning as WarningIcon } from '@mui/icons-material';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

const TeacherStudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    class: '',
    userId: '',
    username: '',
    password: '',
    createUser: true
  });

  // Function to fetch teacher's classes
  const fetchTeacherClasses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teacher-classes/my-classes');
      setTeacherClasses(response.data);
      console.log('Teacher classes:', response.data);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      setError('Failed to fetch your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch all classes
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/classes');
      setClasses(response.data);
      console.log('All classes:', response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch students for teacher's classes
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/students/my-students');

      // Flatten the students from all classes
      const allStudents = [];
      for (const classGroup of response.data) {
        for (const student of classGroup.students) {
          allStudents.push({
            ...student,
            class: classGroup.classInfo
          });
        }
      }

      setStudents(allStudents);
      console.log('Students:', allStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when component mounts
  useEffect(() => {
    fetchTeacherClasses();
    fetchClasses();
    fetchStudents();
  }, [fetchTeacherClasses, fetchClasses, fetchStudents]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      rollNumber: '',
      class: '',
      userId: '',
      username: '',
      password: '',
      createUser: true
    });
    setSelectedStudent(null);
  };

  const handleOpenDialog = (student = null) => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        email: student.email || '',
        rollNumber: student.rollNumber || '',
        class: student.class._id || student.class,
        userId: student.userId || '',
        username: '',
        password: '',
        createUser: false
      });
      setSelectedStudent(student);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.class) {
        setError('First name, last name, and class are required');
        setLoading(false);
        return;
      }

      if (selectedStudent) {
        // Update existing student
        const updateData = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          rollNumber: formData.rollNumber,
          class: formData.class
        };

        await api.put(`/api/students/${selectedStudent._id}`, updateData);
        setSuccess('Student updated successfully');
      } else {
        // For new students, use the direct student registration endpoint
        const registrationData = {
          username: formData.username || formData.rollNumber || `student_${Date.now()}`,
          email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@example.com`,
          password: formData.password || 'password123', // Default password
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          classId: formData.class,
          admissionNumber: formData.rollNumber || '',
          gender: 'male' // Default gender
        };

        // Get the token directly from localStorage to ensure it's fresh
        const token = localStorage.getItem('token');
        console.log('Using token for student registration:', token ? 'Token exists' : 'No token');

        // Make the API call with explicit headers
        await api.post('/api/direct-student-register', registrationData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setSuccess('Student registered successfully');
      }

      // Refresh student list
      fetchStudents();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving student:', err);

      // Check for specific authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication error: You may not have permission to perform this action. Please try logging out and back in.');

        // Log detailed information for debugging
        console.error('Authentication error details:', {
          status: err.response?.status,
          message: err.response?.data?.message,
          url: err.config?.url,
          method: err.config?.method
        });
      } else {
        // For other errors
        setError(err.response?.data?.message || 'Failed to save student. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/students/${selectedStudent._id}`);
      setSuccess('Student deleted successfully');
      fetchStudents(); // Refresh the list
      setDeleteDialog(false);
      setSelectedStudent(null);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err.response?.data?.message || 'Failed to delete student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (student) => {
    setSelectedStudent(student);
    setDeleteDialog(true);
  };

  // Check if a class is one of the teacher's classes
  const isTeacherClass = (classId) => {
    return teacherClasses.some(cls => cls._id === classId);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Student Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Student
          </Button>
        </Box>

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

        {loading && !openDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Middle Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell><SafeDisplay value={student.rollNumber} /></TableCell>
                      <TableCell><SafeDisplay value={student.firstName} /></TableCell>
                      <TableCell><SafeDisplay value={student.middleName} /></TableCell>
                      <TableCell><SafeDisplay value={student.lastName} /></TableCell>
                      <TableCell><SafeDisplay value={student.email} /></TableCell>
                      <TableCell>
                        <SafeDisplay value={student.class?.name} />
                        {student.class && isTeacherClass(student.class._id) && (
                          <Chip
                            size="small"
                            label="Your Class"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Student">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(student)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Student">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(student)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Student Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Class</InputLabel>
                  <Select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    label="Class"
                  >
                    <MenuItem value="">
                      <em>Select a class</em>
                    </MenuItem>
                    {teacherClasses.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name} {cls.section} - Your Class
                      </MenuItem>
                    ))}
                    {classes
                      .filter(cls => !teacherClasses.some(tc => tc._id === cls._id))
                      .map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name} {cls.section}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {!selectedStudent && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username (optional)"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      helperText="If left blank, roll number or auto-generated value will be used"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password (optional)"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      helperText="If left blank, a default password will be used"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (selectedStudent ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} /> Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the student <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. The student account and all associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteStudent}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherStudentManagement;
