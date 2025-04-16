import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { refreshToken } from '../../utils/loginUtils';
import { isTokenValid } from '../../utils/authUtils';

/**
 * TokenRefreshButton Component
 * 
 * A button that allows users to manually refresh their authentication token
 */
const TokenRefreshButton = ({ variant = 'contained', color = 'primary', size = 'medium' }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await refreshToken();
      
      setSuccess(true);
    } catch (err) {
      console.error('Error refreshing token:', err);
      setError(err.response?.data?.message || err.message || 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const isValid = isTokenValid();

  return (
    <>
      <Button
        variant={variant}
        color={isValid ? color : 'warning'}
        size={size}
        onClick={handleRefresh}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
      >
        {isValid ? 'Refresh Token' : 'Token Expired - Refresh Now'}
      </Button>
      
      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Token refreshed successfully!
        </Alert>
      </Snackbar>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TokenRefreshButton;
