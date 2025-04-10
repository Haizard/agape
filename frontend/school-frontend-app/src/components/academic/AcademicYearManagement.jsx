import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Chip,
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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import AcademicYearForm from './AcademicYearForm';
import { useAcademic } from '../../contexts/AcademicContext';

const AcademicYearManagement = () => {
  const {
    academicYears,
    currentYear,
    loading,
    error: contextError,
    fetchAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setActiveAcademicYear
  } = useAcademic();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Combine errors from context and local state
  const displayError = contextError || error;

  useEffect(() => {
    // Refresh academic years when component mounts
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

  const handleSuccess = async (academicYearData) => {
    try {
      let result;

      if (selectedYear) {
        // Update existing academic year
        result = await updateAcademicYear(selectedYear._id, academicYearData);
        if (result.success) {
          setSuccessMessage('Academic year updated successfully');
        } else {
          setError(result.error);
          return;
        }
      } else {
        // Create new academic year
        result = await createAcademicYear(academicYearData);
        if (result.success) {
          setSuccessMessage('Academic year created successfully');
        } else {
          setError(result.error);
          return;
        }
      }

      handleCloseDialog();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error in academic year operation:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteAcademicYear(id);

      if (result.success) {
        setSuccessMessage('Academic year deleted successfully');
        setDeleteConfirmOpen(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting the academic year');
      console.error('Error deleting academic year:', err);
    }
  };

  const handleSetActive = async (id) => {
    try {
      const result = await setActiveAcademicYear(id);

      if (result.success) {
        setSuccessMessage('Academic year set as active successfully');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred while setting the active academic year');
      console.error('Error setting active academic year:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Academic Year Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create New Academic Year
          </Button>
        </Box>

        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {displayError}
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

        <AcademicYearForm
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
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
            {selectedYear && selectedYear.isActive && (
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
              disabled={selectedYear && selectedYear.isActive}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AcademicYearManagement;
