import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { ArtisticFormField, ArtisticButton } from './ui';
import CloseIcon from '@mui/icons-material/Close';
import { setUser } from '../store/slices/userSlice';
import api from '../services/api';
import PropTypes from 'prop-types';
import { storeAuthToken, storeUserData, getRoleRoute } from '../utils/authUtils';

const LoginForm = ({ onClose }) => {
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

    // Store token and user data using our utility functions
    storeAuthToken(token);
    storeUserData(user);

    // Log token for debugging
    console.log('Token stored successfully');

    // Log user data for debugging
    console.log('User data stored successfully');
    console.log('User role:', user.role);

    // Set api default authorization header
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    // Dispatch user to Redux store with complete user data including role
    const userData = { ...user, token };
    console.log('Dispatching user data to Redux:', userData);
    dispatch(setUser(userData));

    // Close the login modal
    onClose();

    // Navigate to the appropriate route based on user role using our utility function
    const targetRoute = getRoleRoute();
    console.log(`Redirecting to ${targetRoute} based on role: ${user.role}`);
    navigate(targetRoute, { replace: true });

    // Set loading to false
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      console.log('Attempting login for:', emailOrUsername);

      try {
        // First try with fetch to bypass any axios issues
        // Get the base API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        // Ensure the URL ends with /api
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
        // Remove any double /api/api
        const cleanBaseUrl = baseUrl.replace('/api/api', '/api');
        // Construct the login URL
        const loginUrl = `${cleanBaseUrl}/users/login`;
        console.log('Using login URL:', loginUrl);
        const fetchResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ emailOrUsername, password })
        });

        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          console.log('Login successful with fetch:', data);

          // Continue with the normal flow using the fetch response data
          const response = { data };
          return handleLoginSuccess(response);
        }

        console.log('Fetch login failed, trying with axios...');
      } catch (fetchError) {
        console.error('Fetch login error:', fetchError);
        console.log('Trying with axios instead...');
      }

      // If fetch fails, try with axios
      const response = await api.post('/api/users/login', {
        emailOrUsername,
        password
      });

      // Handle successful login with axios
      handleLoginSuccess(response);
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed';

      if (err.response) {
        console.error('Error response:', err.response.data);
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage;
      } else if (err.request) {
        console.error('Error request:', err.request);
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        console.error('Error message:', err.message);
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
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
          <ArtisticFormField
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
          <ArtisticFormField
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
          <ArtisticButton
            type="submit"
            fullWidth
            variant="gradient"
            gradient="linear-gradient(45deg, #3B82F6, #60A5FA)"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </ArtisticButton>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <ArtisticButton
          onClick={() => navigate('/register')}
          variant="ghost"
          color="secondary"
        >
          {"Don't have an account? Sign Up"}
        </ArtisticButton>
      </DialogActions>
    </>
  );
};

// Add PropTypes validation
LoginForm.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default LoginForm;
