import React, { useState } from 'react';
import { Button, Alert, CircularProgress, Box } from '@mui/material';
import api from '../../services/api';

const FixAssignmentsButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFixAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post('/api/teachers/fix-assignments');

      setResult(response.data);
      console.log('Fix assignments result:', response.data);
    } catch (err) {
      console.error('Error fixing assignments:', err);
      setError(err.response?.data?.message || 'An error occurred while fixing assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="contained"
        color="warning"
        onClick={handleFixAssignments}
        disabled={loading}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        {loading && (
          <CircularProgress
            size={20}
            color="inherit"
            sx={{ mr: 1 }}
          />
        )}
        Fix Teacher-Subject Assignments
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <p>{result.message}</p>
          <p>Created {result.results.filter(r => r.action === 'created').length} new assignments</p>
          <p>Found {result.results.filter(r => r.action === 'exists').length} existing assignments</p>
        </Alert>
      )}
    </Box>
  );
};

export default FixAssignmentsButton;
