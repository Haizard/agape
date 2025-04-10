import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import api from '../../services/api';

// Create a simple date picker component
const SimpleDatePicker = (props) => {
  const { label, value, onChange, fullWidth } = props;
  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        if (onChange) {
          onChange(new Date(e.target.value));
        }
      }}
      InputLabelProps={{
        shrink: true,
      }}
    />
  );
};

// Add prop types for the component
SimpleDatePicker.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  fullWidth: PropTypes.bool
};

// Set display name
SimpleDatePicker.displayName = 'SimpleDatePicker';

const CreateAcademicYear = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [academicYear, setAcademicYear] = useState({
    name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    year: new Date().getFullYear(),
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAcademicYear(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setAcademicYear(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate inputs
      if (!academicYear.name || !academicYear.year) {
        setError('Name and year are required');
        setLoading(false);
        return;
      }

      // Create academic year
      const response = await api.post('/api/academic-years', academicYear);
      console.log('Academic year created:', response.data);

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error creating academic year:', error);
      setError(error.response?.data?.message || 'Failed to create academic year');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Academic Year</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={academicYear.name}
                onChange={handleChange}
                required
                helperText="e.g., 2023-2024"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                name="year"
                type="number"
                value={academicYear.year}
                onChange={handleChange}
                required
                helperText="e.g., 2023"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SimpleDatePicker
                label="Start Date"
                value={academicYear.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SimpleDatePicker
                label="End Date"
                value={academicYear.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Academic Year'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CreateAcademicYear.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default CreateAcademicYear;
