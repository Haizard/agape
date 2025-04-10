import React, { useState, useEffect } from 'react';
import SafeDisplay from '../components/common/SafeDisplay';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Grid,
  TextField,
  Alert,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  ListItemText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUserAccount, setCreatedUserAccount] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    qualification: '',
    specialization: '',
    experience: '',
    subjects: [],
    joiningDate: '',
    employeeId: '',
    salary: '',
    status: 'active',
    createAccount: true, // Default to creating a user account
    password: '' // Optional custom password
  });

  // Fetch all subjects
  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/subjects');
      setAllSubjects(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      console.log('Fetching teachers...');
      const response = await api.get('/api/teachers');
      console.log('Teachers response:', response.data);
      setTeachers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError(`Failed to fetch teachers: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if token exists and log it
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Token for submission:', token.substring(0, 10) + '...');

      const submissionData = {
        ...formData,
        // Only include password if creating a new teacher with an account and a password is provided
        password: formData.createAccount && formData.password ? formData.password : undefined,
        subjects: formData.subjects.length ? formData.subjects : undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        joiningDate: formData.joiningDate || new Date().toISOString(),
        salary: formData.salary ? Number(formData.salary) : undefined,
        createAccount: formData.createAccount // Include the createAccount flag
      };

      console.log('Submitting teacher data with createAccount:', formData.createAccount);

      if (selectedTeacher) {
        await api.put(`/api/teachers/${selectedTeacher._id}`, submissionData);
        setSuccess('Teacher updated successfully!');
        setCreatedUserAccount(null);
      } else {
        const response = await api.post('/api/teachers', submissionData);
        console.log('Teacher creation response:', response.data);

        // Check if a user account was created
        if (response.data.userAccount) {
          setCreatedUserAccount(response.data.userAccount);
          setSuccess('Teacher created successfully with user account!');
        } else {
          setSuccess('Teacher created successfully!');
          setCreatedUserAccount(null);
        }
      }

      fetchTeachers(); // Refresh the teachers list
      resetForm();
    } catch (err) {
      console.error('Error saving teacher:', err);

      if (err.response) {
        // Server responded with an error
        console.error('Error response:', err.response.data);
        console.error('Status code:', err.response.status);

        if (err.response.status === 401 || err.response.status === 403) {
          // Authentication or authorization error
          setError('Authentication error. Please log in again.');
          // Clear token to force re-login
          localStorage.removeItem('token');
        } else {
          setError(err.response.data?.message || 'Failed to save teacher. Please try again.');
        }
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request);
        setError('No response from server. Please check your network connection.');
      } else {
        // Error in setting up the request
        console.error('Error message:', err.message);
        setError('Error setting up request: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        console.log('Deleting teacher with ID:', teacherId);
        await api.delete(`/api/teachers/${teacherId}`);
        setSuccess('Teacher deleted successfully!');
        fetchTeachers();
      } catch (err) {
        console.error('Error deleting teacher:', err);
        setError(err.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      contactNumber: teacher.contactNumber,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      address: teacher.address,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      experience: teacher.experience,
      subjects: teacher.subjects,
      joiningDate: teacher.joiningDate,
      employeeId: teacher.employeeId,
      salary: teacher.salary,
      status: teacher.status,
      createAccount: false, // Don't create account when editing
      password: '' // No password needed when editing
    });
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    setSelectedTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      qualification: '',
      specialization: '',
      experience: '',
      subjects: [],
      joiningDate: '',
      employeeId: '',
      salary: '',
      status: 'active',
      createAccount: true,
      password: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      qualification: '',
      specialization: '',
      experience: '',
      subjects: [],
      joiningDate: '',
      employeeId: '',
      salary: '',
      status: 'active',
      createAccount: true,
      password: ''
    });
    // Clear any created user account info
    setCreatedUserAccount(null);
  };

  // Add form validation
  const validateForm = () => {
    const required = [
      'firstName',
      'lastName',
      'email',
      'employeeId',
      'qualification',
      'experience'
    ];

    for (const field of required) {
      if (!formData[field]) {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }
    return true;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Teacher Management</Typography>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Add New Teacher
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
          {createdUserAccount && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Login Credentials:
              </Typography>
              <Typography variant="body2">
                Username: {createdUserAccount.username}
              </Typography>
              <Typography variant="body2">
                Password: {createdUserAccount.password}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'warning.main' }}>
                Please save these credentials! They won't be shown again.
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher._id}>
                <TableCell><SafeDisplay value={teacher.employeeId} /></TableCell>
                <TableCell><SafeDisplay value={`${teacher.firstName} ${teacher.lastName}`} /></TableCell>
                <TableCell><SafeDisplay value={teacher.email} /></TableCell>
                <TableCell><SafeDisplay value={teacher.contactNumber} /></TableCell>
                <TableCell><SafeDisplay value={teacher.status} /></TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(teacher)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(teacher._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="subjects-label">Subjects Qualified to Teach</InputLabel>
                  <Select
                    labelId="subjects-label"
                    id="subjects"
                    multiple
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleChange}
                    input={<OutlinedInput label="Subjects Qualified to Teach" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const subject = allSubjects.find(s => s._id === value);
                          return (
                            <Chip key={value} label={subject ? subject.name : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {allSubjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        <Checkbox checked={formData.subjects.indexOf(subject._id) > -1} />
                        <ListItemText primary={subject.name} secondary={subject.code} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experience (years)"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.createAccount}
                      onChange={(e) => setFormData({...formData, createAccount: e.target.checked})}
                      name="createAccount"
                      color="primary"
                    />
                  }
                  label="Create user account for this teacher"
                />
              </Grid>

              {formData.createAccount && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password (Optional)"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    helperText="Leave blank to generate a random password"
                  />
                </Grid>
              )}
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCloseDialog} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (selectedTeacher ? 'Update' : 'Save')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TeacherManagement;






