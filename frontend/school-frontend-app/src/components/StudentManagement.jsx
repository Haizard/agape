import React, { useState, useEffect, useCallback } from 'react';
import SafeDisplay from '../components/common/SafeDisplay';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, CircularProgress, Alert, Container,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, MenuItem, IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rollNumber: '',
    class: '',
    userId: '', // Added userId field
    username: '', // Added for user creation
    password: '', // Added for user creation
    createUser: true // Flag to create a user account
  });

  // Helper function to create a loadData function
  // Using useCallback to memoize this function
  const createLoadDataFunction = useCallback(() => {
    return async () => {
      setLoading(true);
      try {
        const [studentsRes, classesRes] = await Promise.all([
          api.get('/api/students'),
          api.get('/api/classes')
        ]);
        setStudents(studentsRes.data);
        setClasses(classesRes.data);
        setError('');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
  }, []);  // State setters from useState are stable and don't need to be dependencies

  // This effect runs once when the component mounts
  useEffect(() => {
    // Create a loadData function using our helper
    const loadData = createLoadDataFunction();

    // Call the function
    loadData();
  }, [createLoadDataFunction]);  // Now we include the dependency

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
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
        lastName: student.lastName,
        email: student.email,
        rollNumber: student.rollNumber,
        class: student.class._id || student.class,
        userId: student.userId,
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
    try {
      if (selectedStudent) {
        // For updates, we don't need to create a user
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          rollNumber: formData.rollNumber,
          class: formData.class
        };
        await api.put(`/api/students/${selectedStudent._id}`, updateData);
        setSuccess('Student updated successfully');
      } else {
        // For new students, we need to create a user account first if createUser is true
        if (formData.createUser) {
          // Use the unified user creation service
          const userData = {
            username: formData.username || formData.rollNumber,
            email: formData.email,
            password: formData.password || 'tempPassword123',
            role: 'student',
            firstName: formData.firstName,
            lastName: formData.lastName,
            classId: formData.class,
            admissionNumber: formData.rollNumber
          };

          await api.post('/api/users/register', userData);
          setSuccess('Student created successfully with user account');
        } else {
          // If not creating a user, ensure we have a userId
          if (!formData.userId) {
            throw new Error('User ID is required when not creating a new user account');
          }

          const studentData = {
            userId: formData.userId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            rollNumber: formData.rollNumber,
            class: formData.class
          };

          await api.post('/api/students', studentData);
          setSuccess('Student created successfully');
        }
      }
      handleCloseDialog();

      // Reload data after successful operation
      const loadData = createLoadDataFunction();

      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    setLoading(true);
    try {
      await api.delete(`/api/students/${studentId}`);
      setSuccess('Student deleted successfully');

      // Reload data after successful deletion
      const loadData = createLoadDataFunction();

      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Student Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Add New Student
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

      {loading ? (
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
                <TableCell>Last Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell><SafeDisplay value={student.rollNumber} /></TableCell>
                  <TableCell><SafeDisplay value={student.firstName} /></TableCell>
                  <TableCell><SafeDisplay value={student.lastName} /></TableCell>
                  <TableCell><SafeDisplay value={student.email} /></TableCell>
                  <TableCell><SafeDisplay value={student.class} /></TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(student)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(student._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Roll Number"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="Class"
              name="class"
              value={formData.class}
              onChange={handleChange}
              margin="normal"
              required
            >
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))}
            </TextField>

            {!selectedStudent && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  User Account Information
                </Typography>

                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                  helperText="Leave blank to use roll number as username"
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  helperText="Leave blank to use default password"
                />
              </>
            )}
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
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentManagement;

