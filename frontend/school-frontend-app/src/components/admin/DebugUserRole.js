import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  TextField
} from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const DebugUserRole = () => {
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tokenInfo, setTokenInfo] = useState(null);

  const fetchCurrentUser = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/debug/current-user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserInfo(response.data);
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError(err.response?.data?.message || 'Failed to fetch user info');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/debug/verify-token', { token });
      
      setTokenInfo(response.data);
    } catch (err) {
      console.error('Error verifying token:', err);
      setError(err.response?.data?.message || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/debug/admin-users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserInfo(response.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError(err.response?.data?.message || 'Failed to fetch admin users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Debug User Role
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current User from Redux Store
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Username:</strong> {user?.username || 'Not available'}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {user?.role || 'Not available'}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user?.email || 'Not available'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          JWT Token
        </Typography>
        
        <TextField
          fullWidth
          label="JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={fetchCurrentUser}
            disabled={loading}
          >
            Fetch Current User
          </Button>
          
          <Button
            variant="contained"
            onClick={verifyToken}
            disabled={loading}
          >
            Verify Token
          </Button>
          
          <Button
            variant="contained"
            onClick={fetchAdminUsers}
            disabled={loading}
          >
            Fetch Admin Users
          </Button>
        </Box>
        
        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        
        {userInfo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Info from API
            </Typography>
            
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </Box>
        )}
        
        {tokenInfo && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Token Info
            </Typography>
            
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DebugUserRole;
