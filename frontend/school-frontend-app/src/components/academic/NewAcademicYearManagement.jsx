import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import NewAcademicYearForm from './NewAcademicYearForm';
import axios from 'axios';

const NewAcademicYearManagement = () => {
  const { user } = useSelector((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [academicYears, setAcademicYears] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch academic years
  const fetchAcademicYears = React.useCallback(async () => {
    setLoading(true);
    try {
      // Try the new endpoint first
      try {
        const response = await axios.get('/api/new-academic-years');
        setAcademicYears(response.data);
        setError('');
      } catch (newApiErr) {
        // Fall back to the original endpoint if the new one fails
        console.log('Falling back to original API endpoint');
        const response = await axios.get('/api/academic-years');
        setAcademicYears(response.data);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
      setError('Failed to load academic years. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load academic years on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  const handleOpenDialog = (year = null) => {
    setSelectedYear(year);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedYear(null);
    setOpenDialog(false);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedYear) {
        // Update existing academic year
        try {
          await axios.put(`/api/new-academic-years/${selectedYear._id}`, formData);
        } catch (newApiErr) {
          // Fall back to original endpoint
          await axios.put(`/api/academic-years/${selectedYear._id}`, formData);
        }
        setSuccessMessage('Academic year updated successfully');
      } else {
        // Create new academic year
        try {
          await axios.post('/api/new-academic-years', formData);
        } catch (newApiErr) {
          // Fall back to original endpoint
          await axios.post('/api/academic-years', formData);
        }
        setSuccessMessage('Academic year created successfully');
      }

      // Refresh the list
      fetchAcademicYears();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving academic year:', err);
      setError(err.response?.data?.message || 'Failed to save academic year');
    }
  };

  const handleDelete = async (id) => {
    try {
      try {
        await axios.delete(`/api/new-academic-years/${id}`);
      } catch (newApiErr) {
        // Fall back to original endpoint
        await axios.delete(`/api/academic-years/${id}`);
      }
      setSuccessMessage('Academic year deleted successfully');
      setDeleteConfirmOpen(false);
      fetchAcademicYears();
    } catch (err) {
      console.error('Error deleting academic year:', err);
      setError(err.response?.data?.message || 'Failed to delete academic year');
    }
  };

  const handleSetActive = async (id) => {
    try {
      const yearToActivate = academicYears.find(year => year._id === id);
      if (!yearToActivate) {
        setError('Academic year not found');
        return;
      }

      try {
        await axios.put(`/api/new-academic-years/${id}`, {
          ...yearToActivate,
          isActive: true
        });
      } catch (newApiErr) {
        // Fall back to original endpoint
        await axios.put(`/api/academic-years/${id}`, {
          ...yearToActivate,
          isActive: true
        });
      }

      setSuccessMessage('Academic year set as active successfully');
      fetchAcademicYears();
    } catch (err) {
      console.error('Error setting active academic year:', err);
      setError(err.response?.data?.message || 'Failed to set active academic year');
    }
  };

  if (loading && academicYears.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isAdmin ? 'Academic Year Management' : 'Academic Years'}
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create New Academic Year
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {academicYears.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No academic years found. Click "Create New Academic Year" to add one.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {academicYears.map((year) => (
            <Grid item xs={12} md={6} key={year._id}>
              <Paper sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
                {year.isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'success.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      transform: 'rotate(45deg) translate(20%, -50%)',
                      transformOrigin: 'top right',
                      boxShadow: 1,
                      zIndex: 1
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      ACTIVE
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {year.name || `Academic Year ${year.year}`}
                  </Typography>
                  <Box>
                    {!year.isActive && (
                      <Tooltip title="Set as active academic year">
                        <IconButton
                          onClick={() => handleSetActive(year._id)}
                          color="success"
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit academic year">
                      <IconButton onClick={() => handleOpenDialog(year)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete academic year">
                      <IconButton
                        onClick={() => {
                          setSelectedYear(year);
                          setDeleteConfirmOpen(true);
                        }}
                        color="error"
                        size="small"
                        disabled={year.isActive} // Prevent deleting active year
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="subtitle1" color="text.secondary">
                  Year: {year.year}
                </Typography>

                <Typography color="text.secondary" gutterBottom>
                  {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Terms
                  </Typography>
                  <Tooltip title="Terms define the academic periods within the year">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {year.terms && year.terms.length > 0 ? (
                  year.terms.map((term, index) => (
                    <Box key={`${year._id}-term-${index}`} sx={{ ml: 2, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{term.name}:</strong> {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    No terms defined for this academic year.
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <NewAcademicYearForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        academicYear={selectedYear}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this academic year? This action cannot be undone.
          </Typography>
          {selectedYear?.isActive && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You cannot delete an active academic year. Please set another year as active first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(selectedYear?._id)}
            color="error"
            variant="contained"
            disabled={selectedYear?.isActive}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewAcademicYearManagement;
