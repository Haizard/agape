import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/userSlice';
import { forceSetAdminRole } from '../../utils/roleFixUtil';
import api from '../../services/api';

/**
 * A button component that fixes the user role issue
 * This is a temporary solution for the issue where the user is logged in as admin but the system recognizes them as teacher
 */
const RoleFixButton = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const dispatch = useDispatch();

  const handleFixRole = () => {
    try {
      // Force set the user role to admin
      const updatedUser = forceSetAdminRole();
      
      if (!updatedUser) {
        console.error('Failed to update user role: No user found');
        setError(true);
        return;
      }
      
      // Update the API authorization header
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Update the Redux store
      dispatch(setUser(updatedUser));
      
      // Show success message
      setSuccess(true);
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error fixing role:', err);
      setError(true);
    }
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="warning" 
        onClick={handleFixRole}
        sx={{ mt: 2, mb: 2 }}
      >
        Fix Admin Role Issue
      </Button>
      
      <Snackbar 
        open={success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Role fixed successfully! Reloading page...
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={error} 
        autoHideDuration={3000} 
        onClose={() => setError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(false)}>
          Failed to fix role. Please try logging in again.
        </Alert>
      </Snackbar>
    </>
  );
};

export default RoleFixButton;
