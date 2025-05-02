import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

// Import enhanced components
import {
  PageHeader,
  SectionContainer,
  SectionHeader,
  AnimatedContainer,
  FadeIn,
  GradientButton,
  IconContainer,
  StyledCard,
  StyledChip
} from '../common';
import NewAcademicYearForm from './NewAcademicYearForm';
import axios from 'axios';
import { getAuthToken, isTokenValid } from '../../utils/authUtils';
import directApi from '../../services/directApi';

const NewAcademicYearManagement = () => {
  // State for academic year management
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

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
      // Check if token is valid
      const token = getAuthToken();
      const tokenValid = isTokenValid();

      if (token && !tokenValid) {
        // Token validation failed
      }

      const data = await directApi.getAcademicYears();
      setAcademicYears(data);
      setError('');
    } catch (err) {
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
        await directApi.updateAcademicYear(selectedYear._id, formData);
        setSuccessMessage('Academic year updated successfully');
      } else {
        // Create new academic year
        await directApi.createAcademicYear(formData);
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
      await directApi.deleteAcademicYear(id);
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

      await directApi.setActiveAcademicYear(id, yearToActivate);

      setSuccessMessage('Academic year set as active successfully');
      fetchAcademicYears();
    } catch (err) {
      console.error('Error setting active academic year:', err);
      setError(err.response?.data?.message || 'Failed to set active academic year');
    }
  };

  // Show loading only if we're loading and have no data, or if we're in the initial loading state
  if ((loading && academicYears.length === 0) || (loading && !academicYears)) {
    return (
      <AnimatedContainer animation="fadeIn" duration={0.5}>
        <Box sx={{ p: 3 }}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '50vh',
            justifyContent: 'center'
          }}>
            <FadeIn>
              <CircularProgress
                size={60}
                thickness={4}
                sx={{ mb: 3 }}
                color="primary"
              />
            </FadeIn>
            <FadeIn delay={0.2}>
              <Typography
                variant="h5"
                sx={{ mb: 1 }}
                className="gradient-text"
              >
                Loading Academic Years
              </Typography>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Typography variant="body1" color="text.secondary">
                Please wait while we fetch the academic years...
              </Typography>
            </FadeIn>
          </SectionContainer>
        </Box>
      </AnimatedContainer>
  );
  }

  return (

    <AnimatedContainer animation="fadeIn" duration={0.8}>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title={isAdmin ? 'Academic Year Management' : 'Academic Years'}
          subtitle="Create and manage academic years for your school"
          color="primary"
          icon={
            <IconContainer color="primary">
              <CalendarIcon />
            </IconContainer>
          }
          actions={[

            isAdmin && (
              <GradientButton
                key="create-year"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create New Academic Year
              </GradientButton>
            )
          ].filter(Boolean)}
        />

        {error && (
          <FadeIn delay={0.1}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </FadeIn>
        )}

        {successMessage && (
          <FadeIn delay={0.1}>
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              onClose={() => setSuccessMessage('')}
            >
              {successMessage}
            </Alert>
          </FadeIn>
        )}



      {academicYears.length === 0 ? (
        <FadeIn delay={0.2}>
          <SectionContainer sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '30vh',
            justifyContent: 'center'
          }}>
            <IconContainer color="info" size="large">
              <CalendarIcon fontSize="large" />
            </IconContainer>
            <Typography
              variant="h5"
              sx={{ mt: 2, mb: 1 }}
              className="gradient-text"
            >
              No Academic Years Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              You haven't created any academic years yet. Click the "Create New Academic Year" button to get started.
            </Typography>
            {isAdmin && (
              <GradientButton
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create New Academic Year
              </GradientButton>
            )}
          </SectionContainer>
        </FadeIn>
      ) : (
        <FadeIn delay={0.2}>
          <Grid container spacing={3}>
            {academicYears.map((year) => (
              <Grid item xs={12} md={6} key={year._id}>
                <StyledCard sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}>
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

                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        background: year.isActive ? 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)' : 'inherit',
                        WebkitBackgroundClip: year.isActive ? 'text' : 'inherit',
                        WebkitTextFillColor: year.isActive ? 'transparent' : 'inherit',
                      }}
                    >
                      {year.name || `Academic Year ${year.year}`}
                    </Typography>
                    <Box>
                      {!year.isActive && (
                        <Tooltip title="Set as active academic year">
                          <IconButton
                            onClick={() => handleSetActive(year._id)}
                            color="success"
                            size="small"
                            sx={{
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' }
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit academic year">
                        <IconButton
                          onClick={() => handleOpenDialog(year)}
                          size="small"
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                        >
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
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <StyledChip
                      label={`Year: ${year.year}`}
                      color="primary"
                      variant="outlined"
                    />
                    <StyledChip
                      label={year.educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                      color={year.educationLevel === 'O_LEVEL' ? 'success' : 'secondary'}
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                        fontWeight: 500
                      }}
                    >
                      <CalendarIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        '&::before': {
                          content: '""',
                          display: 'inline-block',
                          width: '3px',
                          height: '16px',
                          backgroundColor: 'primary.main',
                          marginRight: '8px',
                          borderRadius: '3px'
                        }
                      }}
                    >
                      Terms
                    </Typography>
                    <Tooltip title="Terms define the academic periods within the year">
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {year.terms && year.terms.length > 0 ? (
                    <Box sx={{
                      ml: 2,
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }}>
                      {year.terms.map((term, index) => (
                        <Box
                          key={`${year._id}-term-${index}`}
                          sx={{
                            mb: index < year.terms.length - 1 ? 1.5 : 0,
                            pb: index < year.terms.length - 1 ? 1.5 : 0,
                            borderBottom: index < year.terms.length - 1 ? '1px dashed rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600 }}
                          >
                            {term.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      No terms defined for this academic year.
                    </Typography>
                  )}
                </Box>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
        </FadeIn>
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
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          fontWeight: 'bold',
          color: 'error.main'
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete this academic year? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Deleting an academic year will remove all associated data including terms and assignments.
          </Typography>
          {selectedYear?.isActive && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              icon={<InfoIcon />}
            >
              You cannot delete an active academic year. Please set another year as active first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <GradientButton
            onClick={() => setDeleteConfirmOpen(false)}
            color="primary"
            variant="outlined"
          >
            Cancel
          </GradientButton>
          <GradientButton
            onClick={() => handleDelete(selectedYear?._id)}
            color="error"
            variant="contained"
            disabled={selectedYear?.isActive}
            startIcon={<DeleteIcon />}
          >
            Delete
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
    </AnimatedContainer>
  );
};

export default NewAcademicYearManagement;
