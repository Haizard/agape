import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const FixedExamTypeManagement = () => {
  const [examTypes, setExamTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMarks: 100,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchExamTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/exam-types');
      setExamTypes(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching exam types:', err);
      setError('Failed to load exam types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamTypes();
  }, []);

  const handleOpen = (examType = null) => {
    if (examType) {
      setSelectedExamType(examType);
      setFormData({
        name: examType.name,
        description: examType.description || '',
        maxMarks: examType.maxMarks,
        isActive: examType.isActive
      });
    } else {
      setSelectedExamType(null);
      setFormData({
        name: '',
        description: '',
        maxMarks: 100,
        isActive: true
      });
    }
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExamType(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (formData.maxMarks <= 0) {
      errors.maxMarks = 'Max marks must be greater than 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');

      // Set the Authorization header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('Submitting form data:', formData);

      // First test the authorization with the debug route
      try {
        const testResponse = await axios.post('/api/debug/test-exam-type', formData, config);
        console.log('Authorization test response:', testResponse.data);
      } catch (testErr) {
        console.error('Authorization test failed:', testErr);
        setError(testErr.response?.data?.message || 'Authorization test failed. You may not have admin privileges.');
        setLoading(false);
        return;
      }

      if (selectedExamType) {
        // Update existing exam type
        const response = await axios.put(
          `/api/exam-types/${selectedExamType._id}`,
          formData,
          config
        );
        console.log('Update response:', response.data);
        setSuccess('Exam type updated successfully');
      } else {
        // Create new exam type
        const response = await axios.post('/api/exam-types', formData, config);
        console.log('Create response:', response.data);
        setSuccess('Exam type created successfully');
      }

      // Refresh the list and close the dialog
      fetchExamTypes();
      handleClose();
    } catch (err) {
      console.error('Error saving exam type:', err);
      setError(err.response?.data?.message || 'Failed to save exam type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam type?')) {
      setLoading(true);
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');

        // Set the Authorization header
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        await axios.delete(`/api/exam-types/${id}`, config);
        setSuccess('Exam type deleted successfully');
        fetchExamTypes();
      } catch (err) {
        console.error('Error deleting exam type:', err);
        setError(err.response?.data?.message || 'Failed to delete exam type. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpen()}
        sx={{ mb: 3 }}
      >
        Add New Exam Type
      </Button>

      {loading && examTypes.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Max Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No exam types found. Create one by clicking "Add New Exam Type".
                  </TableCell>
                </TableRow>
              ) : (
                examTypes.map((examType) => (
                  <TableRow key={examType._id}>
                    <TableCell>{examType.name}</TableCell>
                    <TableCell>{examType.description}</TableCell>
                    <TableCell>{examType.maxMarks}</TableCell>
                    <TableCell>{examType.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpen(examType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(examType._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedExamType ? 'Edit Exam Type' : 'Add New Exam Type'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Max Marks"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
              margin="normal"
              required
              error={!!formErrors.maxMarks}
              helperText={formErrors.maxMarks}
              inputProps={{ min: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (selectedExamType ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default FixedExamTypeManagement;
