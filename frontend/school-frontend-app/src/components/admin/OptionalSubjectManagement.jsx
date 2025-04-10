import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../services/api';

const OptionalSubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    educationLevel: 'O_LEVEL',
    passMark: 40,
    type: 'OPTIONAL'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'optional', 'core'

  // Fetch all subjects
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/subjects');
      setSubjects(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilter(newValue === 0 ? 'all' : newValue === 1 ? 'optional' : 'core');
  };

  // Filter subjects based on current filter
  const filteredSubjects = subjects.filter(subject => {
    if (filter === 'all') return true;
    if (filter === 'optional') return subject.type === 'OPTIONAL';
    if (filter === 'core') return subject.type === 'CORE';
    return true;
  });

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
      description: '',
      educationLevel: 'O_LEVEL',
      passMark: 40,
      type: 'OPTIONAL'
    });
    setOpenDialog(true);
  };

  // Open dialog for editing a subject
  const handleEditSubject = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      educationLevel: subject.educationLevel || 'O_LEVEL',
      passMark: subject.passMark || 40,
      type: subject.type || 'OPTIONAL'
    });
    setOpenDialog(true);
  };

  // Toggle subject type between CORE and OPTIONAL
  const handleToggleSubjectType = async (subject) => {
    try {
      const newType = subject.type === 'OPTIONAL' ? 'CORE' : 'OPTIONAL';
      await api.patch(`/api/subjects/${subject._id}/type`, { type: newType });

      // Update local state
      setSubjects(prevSubjects =>
        prevSubjects.map(s =>
          s._id === subject._id ? { ...s, type: newType } : s
        )
      );

      setSnackbar({
        open: true,
        message: `Subject marked as ${newType === 'OPTIONAL' ? 'optional' : 'core'} successfully`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error toggling subject type:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to update subject type',
        severity: 'error'
      });
    }
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
        await api.put(`/api/subjects/${currentSubject._id}`, formData);
        setSnackbar({
          open: true,
          message: 'Subject updated successfully',
          severity: 'success'
        });
      } else {
        // Create new subject
        await api.post('/api/subjects', formData);
        setSnackbar({
          open: true,
          message: 'Subject created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save subject',
        severity: 'error'
      });
    }
  };

  // Delete a subject
  const handleDeleteSubject = async () => {
    try {
      await api.delete(`/api/subjects/${currentSubject._id}`);
      setSnackbar({
        open: true,
        message: 'Subject deleted successfully',
        severity: 'success'
      });
      handleCloseDialog();
      fetchSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete subject',
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
          Subject Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchSubjects}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddSubject}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="subject tabs">
              <Tab label="All Subjects" />
              <Tab label="Optional Subjects" />
              <Tab label="Core Subjects" />
            </Tabs>
          </Box>

          <Typography variant="body2" color="textSecondary" paragraph>
            {tabValue === 0 && 'Manage all subjects in the system. Toggle between core and optional types.'}
            {tabValue === 1 && 'These subjects can be selected by students during subject selection.'}
            {tabValue === 2 && 'Core subjects are automatically assigned to all students.'}
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
                    <TableCell>Type</TableCell>
                    <TableCell>Education Level</TableCell>
                    <TableCell>Pass Mark</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No subjects found. {tabValue === 0 ? 'Add some to get started.' : 'Switch to All Subjects tab to add or mark subjects.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <TableRow key={subject._id}>
                        <TableCell>{subject.name}</TableCell>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>
                          <Chip
                            label={subject.type || 'CORE'}
                            color={subject.type === 'OPTIONAL' ? 'secondary' : 'primary'}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>{subject.educationLevel || 'O_LEVEL'}</TableCell>
                        <TableCell>{subject.passMark || 40}</TableCell>
                        <TableCell>{subject.description || '-'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={subject.type === 'OPTIONAL' ? 'Mark as Core' : 'Mark as Optional'}>
                            <IconButton
                              color={subject.type === 'OPTIONAL' ? 'primary' : 'secondary'}
                              onClick={() => handleToggleSubjectType(subject)}
                              size="small"
                            >
                              <Switch
                                checked={subject.type === 'OPTIONAL'}
                                size="small"
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Subject">
                            <IconButton
                              color="primary"
                              onClick={() => handleEditSubject(subject)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Subject">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(subject)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
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
          {currentSubject ? 'Edit Subject' : 'Add Subject'}
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
                helperText="A unique code for the subject (e.g., BIO, CS)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Subject Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Subject Type"
                >
                  <MenuItem value="OPTIONAL">Optional</MenuItem>
                  <MenuItem value="CORE">Core</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="education-level-label">Education Level</InputLabel>
                <Select
                  labelId="education-level-label"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  label="Education Level"
                >
                  <MenuItem value="O_LEVEL">O-Level</MenuItem>
                  <MenuItem value="A_LEVEL">A-Level</MenuItem>
                  <MenuItem value="BOTH">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="passMark"
                label="Pass Mark"
                type="number"
                value={formData.passMark}
                onChange={handleInputChange}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.type === 'OPTIONAL'}
                    onChange={(e) => setFormData({
                      ...formData,
                      type: e.target.checked ? 'OPTIONAL' : 'CORE'
                    })}
                    color="secondary"
                  />
                }
                label={formData.type === 'OPTIONAL' ? 'Optional Subject' : 'Core Subject'}
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
            Are you sure you want to delete the subject "{currentSubject?.name}"? This action cannot be undone.
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

OptionalSubjectManagement.propTypes = {
  // No props required
};

export default OptionalSubjectManagement;
