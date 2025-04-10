import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  TextField,
  Alert,
  Typography,
  MenuItem,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';

const UnifiedUserCreation = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Common user data
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'teacher', // Default role
  });

  // Role-specific profile data
  const [profileData, setProfileData] = useState({
    // Teacher fields
    firstName: '',
    lastName: '',
    contactNumber: '',
    employeeId: '',
    // Student fields
    dateOfBirth: '',
    gender: '',
    classId: '',
    admissionNumber: '',
    // Additional fields can be added as needed
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      const response = await api.get('/api/classes');
      console.log('Classes response:', response.data);
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      let errorMessage = 'Failed to fetch classes';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const response = await api.get('/api/subjects');
      console.log('Subjects response:', response.data);
      setSubjects(response.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      let errorMessage = 'Failed to fetch subjects';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    }
  };

  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });

    // Auto-generate username from email if email changes and username is empty
    if (name === 'email' && !userData.username) {
      const usernameFromEmail = value.split('@')[0];
      setUserData(prev => ({ ...prev, username: usernameFromEmail }));
    }

    // Clear any previous errors
    setError('');
  };

  const handleProfileDataChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });

    // Clear any previous errors
    setError('');
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate user data before proceeding
      if (!userData.username || !userData.email || !userData.password || !userData.role) {
        setError('Please fill in all required user fields');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Password validation (at least 6 characters)
      if (userData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateProfileData = () => {
    // Common validation for all roles
    if (!profileData.firstName || !profileData.lastName) {
      setError('First name and last name are required');
      return false;
    }

    // Role-specific validation
    if (userData.role === 'teacher') {
      if (!profileData.contactNumber) {
        setError('Contact number is required for teachers');
        return false;
      }
    } else if (userData.role === 'student') {
      if (!profileData.classId) {
        setError('Class is required for students');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileData()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine user data and profile data
      const submissionData = {
        ...userData,
        ...profileData
      };

      console.log('Submitting user data:', submissionData);

      const response = await api.post('/api/users/register', submissionData);
      console.log('User creation response:', response.data);

      setSuccess(`${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} created successfully with appropriate profile!`);

      // Reset form
      setUserData({
        username: '',
        email: '',
        password: '',
        role: 'teacher',
      });

      setProfileData({
        firstName: '',
        lastName: '',
        contactNumber: '',
        employeeId: '',
        dateOfBirth: '',
        gender: '',
        classId: '',
        admissionNumber: '',
      });

      // Reset to first step
      setActiveStep(0);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                User Account Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={userData.username}
                onChange={handleUserDataChange}
                required
                helperText="Username will be used for login"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleUserDataChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={userData.password}
                onChange={handleUserDataChange}
                required
                helperText="Minimum 6 characters"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={userData.role}
                onChange={handleUserDataChange}
                required
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {userData.role === 'admin' ? 'Admin' : userData.role === 'teacher' ? 'Teacher' : 'Student'} Profile Information
              </Typography>
            </Grid>

            {/* Common fields for all roles */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileDataChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileDataChange}
                required
              />
            </Grid>

            {/* Teacher-specific fields */}
            {userData.role === 'teacher' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileDataChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="employeeId"
                    value={profileData.employeeId}
                    onChange={handleProfileDataChange}
                    helperText="Leave blank to use username"
                  />
                </Grid>
              </>
            )}

            {/* Student-specific fields */}
            {userData.role === 'student' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleProfileDataChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileDataChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="class-select-label">Class</InputLabel>
                    <Select
                      labelId="class-select-label"
                      id="class-select"
                      name="classId"
                      value={profileData.classId}
                      label="Class"
                      onChange={handleProfileDataChange}
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Admission Number"
                    name="admissionNumber"
                    value={profileData.admissionNumber}
                    onChange={handleProfileDataChange}
                    helperText="Leave blank to use username"
                  />
                </Grid>
              </>
            )}
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New User
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Account Information</StepLabel>
          </Step>
          <Step>
            <StepLabel>Profile Information</StepLabel>
          </Step>
        </Stepper>

        <Box component="form" onSubmit={handleSubmit}>
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            {activeStep !== 0 && (
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
            )}

            {activeStep === 0 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default UnifiedUserCreation;
