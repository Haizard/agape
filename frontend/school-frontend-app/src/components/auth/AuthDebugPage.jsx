import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  TextField,
  Button,
  Grid,
  Alert,
  AlertTitle,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { login, refreshToken } from '../../utils/loginUtils';
import { logout, isTokenValid, getAuthToken } from '../../utils/authUtils';
import TokenInfoDisplay from '../common/TokenInfoDisplay';

/**
 * AuthDebugPage Component
 * 
 * A page for debugging authentication issues
 */
const AuthDebugPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await login(email, password);
      
      setSuccess('Login successful!');
      setPassword(''); // Clear password for security
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await refreshToken();
      
      setSuccess('Token refreshed successfully!');
    } catch (err) {
      console.error('Token refresh error:', err);
      setError(err.response?.data?.message || err.message || 'Token refresh failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    setSuccess('Logged out successfully!');
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(null);
  };
  
  const isAuthenticated = !!getAuthToken();
  const tokenValid = isTokenValid();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Authentication Debug Page
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Authentication Troubleshooting</AlertTitle>
        Use this page to debug authentication issues. You can check your token status, login, refresh your token, or logout.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Token Info */}
        <Grid item xs={12} md={6}>
          <TokenInfoDisplay />
        </Grid>
        
        {/* Login Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LoginIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Login</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <form onSubmit={handleLogin}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
              
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !email || !password}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                >
                  Login
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={loading || !isAuthenticated}
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshToken}
                >
                  Refresh Token
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  disabled={!isAuthenticated}
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Box>
            </form>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Authentication Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Authentication Status</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Alert severity={isAuthenticated ? (tokenValid ? 'success' : 'warning') : 'error'}>
              <AlertTitle>
                {isAuthenticated 
                  ? (tokenValid ? 'Authenticated' : 'Token Expired') 
                  : 'Not Authenticated'}
              </AlertTitle>
              {isAuthenticated 
                ? (tokenValid 
                    ? 'You are currently authenticated with a valid token.' 
                    : 'Your token has expired. Please refresh your token or login again.') 
                : 'You are not authenticated. Please login to continue.'}
            </Alert>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuthDebugPage;
