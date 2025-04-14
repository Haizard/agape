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
  IconButton,
  Grid
} from '@mui/material';
import { ArtisticFormField, ArtisticButton, FormIllustration } from './ui';
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
        // First try with the direct login endpoint to bypass CORS issues
        // Get the base API URL
        const apiUrl = process.env.REACT_APP_API_URL || 'https://agape-render.onrender.com';
        // Construct the direct login URL
        const directLoginUrl = `${apiUrl}/api/login-direct`;
        console.log('Using direct login URL:', directLoginUrl);
        const fetchResponse = await fetch(directLoginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Origin': window.location.origin
          },
          body: JSON.stringify({ emailOrUsername, password }),
          mode: 'cors'
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

      // If fetch fails, try with axios using the direct login endpoint
      const response = await api.post('/api/login-direct', {
        emailOrUsername,
        password
      }, {
        headers: {
          'Origin': window.location.origin
        }
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormIllustration
              image="/assets/images/backgrounds/about-bg.jpg"
              title="Welcome Back"
              subtitle="Sign in to access your account and manage your school activities"
              height={{ xs: 200, md: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
          </Grid>
        </Grid>
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
