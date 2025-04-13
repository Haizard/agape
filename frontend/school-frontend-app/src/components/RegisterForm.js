import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Alert,
  Link as MuiLink
} from '@mui/material';
import {
  ArtisticFormField,
  ArtisticSelect,
  ArtisticButton,
  ArtisticFormLayout
} from './ui';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student' // default role
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users/register', formData);
      navigate('/'); // Redirect to login page
    } catch (error) {
      setError(error.response?.data || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <ArtisticFormLayout
        title="Create an Account"
        subtitle="Join our school community by registering for an account"
        onSubmit={handleSubmit}
        submitLabel="Register"
        error={error ? <Alert severity="error">{error}</Alert> : null}
      >
        <Box sx={{ width: '100%', mb: 2 }}>
          <ArtisticFormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            fullWidth
          />
        </Box>

        <Box sx={{ width: '100%', mb: 2 }}>
          <ArtisticFormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
          />
        </Box>

        <Box sx={{ width: '100%', mb: 2 }}>
          <ArtisticFormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
          />
        </Box>

        <Box sx={{ width: '100%', mb: 3 }}>
          <ArtisticSelect
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'parent', label: 'Parent' }
            ]}
            fullWidth
          />
        </Box>

        <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <MuiLink
              component="button"
              variant="body2"
              onClick={() => navigate('/')}
              sx={{ fontWeight: 'medium' }}
            >
              Sign In
            </MuiLink>
          </Typography>
        </Box>
      </ArtisticFormLayout>
    </Container>
  );
};

export default RegisterForm;



