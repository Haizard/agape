import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../../services/api';

const CoreSubjectManagement = () => {
  const [coreSubjects, setCoreSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch core subjects
  const fetchCoreSubjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/student-subject-selections/core-subjects');
      setCoreSubjects(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching core subjects:', err);
      setError('Failed to load core subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreSubjects();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open dialog for adding a new subject
  const handleAddSubject = () => {
    setCurrentSubject(null);
    setFormData({
      name: '',
      code: '',
      description: ''
    });
    setOpenDialog(true);
  };

  // Open dialog for editing a subject
  const handleEditSubject = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || ''
    });
    setOpenDialog(true);
  };

  // Open dialog for deleting a subject
  const handleDeleteClick = (subject) => {
    setCurrentSubject(subject);
    setOpenDeleteDialog(true);
  };

  // Close all dialogs
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenDeleteDialog(false);
  };

  // Save a subject (create or update)
  const handleSaveSubject = async () => {
    try {
      if (!formData.name || !formData.code) {
        setSnackbar({
          open: true,
          message: 'Subject name and code are required',
          severity: 'error'
        });
        return;
      }

      if (currentSubject) {
        // Update existing subject
        await api.put(`/api/student-subject-selections/core-subjects/${currentSubject._id}`, formData);
        setSnackbar({
          open: true,
          message: 'Core subject updated successfully',
          severity: 'success'
        });
      } else {
        // Create new subject
        await api.post('/api/student-subject-selections/core-subjects', formData);
        setSnackbar({
          open: true,
          message: 'Core subject created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchCoreSubjects();
    } catch (err) {
      console.error('Error saving core subject:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save core subject',
        severity: 'error'
      });
    }
  };

  // Delete a subject
  const handleDeleteSubject = async () => {
    try {
      await api.delete(`/api/student-subject-selections/core-subjects/${currentSubject._id}`);
      setSnackbar({
        open: true,
        message: 'Core subject deleted successfully',
        severity: 'success'
      });
      handleCloseDialog();
      fetchCoreSubjects();
    } catch (err) {
      console.error('Error deleting core subject:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete core subject',
        severity: 'error'
      });
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Core Subject Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSubject}
        >
          Add Core Subject
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            O-Level Core Subjects
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Manage core subjects that are automatically assigned to all O-Level students.
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Subject Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coreSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No core subjects found. Add some to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coreSubjects.map((subject) => (
                      <TableRow key={subject._id}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.description || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditSubject(subject)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(subject)}
                            size="small"
                          >
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
        </CardContent>
      </Card>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentSubject ? 'Edit Core Subject' : 'Add Core Subject'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Subject Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="code"
                label="Subject Code"
                value={formData.code}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="A unique code for the subject (e.g., MATH, ENG)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSubject}
            color="primary"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the core subject "{currentSubject?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteSubject} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CoreSubjectManagement;
