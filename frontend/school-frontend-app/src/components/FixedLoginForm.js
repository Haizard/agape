import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { setUser } from '../store/slices/userSlice';
import api from '../services/api';
import PropTypes from 'prop-types';

const FixedLoginForm = ({ onClose }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Function to handle successful login
  const handleLoginSuccess = (response) => {
    console.log('Login response:', response.data);

    const { token, user } = response.data;

    if (!token || !user) {
      console.error('Invalid login response format:', response.data);
      setError('Invalid response from server. Please try again.');
      setLoading(false);
      return;
    }

    // Store token and user data in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Log token for debugging
    console.log('Token stored:', token);

    // Log user data for debugging
    console.log('User data:', user);
    console.log('User role:', user.role);

    // Set api default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Dispatch user to Redux store with complete user data including role
    const userData = { ...user, token };
    console.log('Dispatching user data to Redux:', userData);
    dispatch(setUser(userData));

    // Close the login modal
    onClose();

    // Navigate to the appropriate route based on user role
    const roleRoutes = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent'
    };

    // Normalize role to lowercase for case-insensitive comparison
    const normalizedRole = user.role.toLowerCase();
    const targetRoute = roleRoutes[normalizedRole] || '/';
    console.log(`Redirecting to ${targetRoute} based on role: ${user.role}`);
    navigate(targetRoute, { replace: true });

    // Set loading to false
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      console.log('Attempting login for:', emailOrUsername);

      // Direct API call with explicit credentials
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ emailOrUsername, password })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful with fetch:', data);
        handleLoginSuccess({ data });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>
        Sign In
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="emailOrUsername"
            label="Email or Username"
            name="emailOrUsername"
            autoComplete="email username"
            autoFocus
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={() => navigate('/register')}>
          {"Don't have an account? Sign Up"}
        </Button>
      </DialogActions>
    </>
  );
};

// Add PropTypes validation
FixedLoginForm.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default FixedLoginForm;
